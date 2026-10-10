# AWS deployment

FitTrack runs on AWS as a React application served from a private S3 bucket through CloudFront, with an Express API on ECS Fargate and a private PostgreSQL database on RDS. Infrastructure is defined by nine independently managed CloudFormation stacks in [`infra/fargate-single-az/`](../infra/fargate-single-az/README.md).

**Application:** [https://d3avuxvegd3iy8.cloudfront.net](https://d3avuxvegd3iy8.cloudfront.net)

This document owns the deployed architecture, infrastructure decisions, security model, deployment procedures, and operational limits. Application internals belong in [architecture](architecture.md), repository CI and image publication in [release process](release-process.md), and local validation in [testing](testing.md#infrastructure-validation).

## Architecture overview

```mermaid
flowchart LR
    Browser[Browser] -->|HTTPS| CF[CloudFront]
    CF -->|HTTPS and signed OAC request| S3[(Private S3 frontend)]
    CF -->|HTTP /api| ALB[Public ALB across two AZs]
    subgraph VPC[Project VPC]
        ALB -->|HTTP 3001| API[Private Fargate backend]
        API -->|Verified TLS 5432| DB[(Private Single-AZ RDS)]
        Migration[One-off Fargate migration] -->|TLS 5432| DB
        API -.->|HTTPS| Endpoints[VPC interface endpoints]
        Migration -.->|HTTPS| Endpoints
        Endpoints -.-> ECR[ECR]
        Endpoints -.-> SM[Secrets Manager]
        Endpoints -.-> CW[CloudWatch Logs]
        Gateway[S3 gateway endpoint] -.-> Layers[AWS-managed ECR image layers]
        API -.-> Gateway
        Migration -.-> Gateway
    end
```

The application uses one public origin. CloudFront serves static content from S3 and forwards `/api` requests to the ALB. ECS maintains the backend task and registers its private network address in the ALB target group. PostgreSQL accepts connections from the task security group. A separate migration task applies schema changes before the corresponding application revision starts.

The workload is deliberately Single-AZ: backend and migration tasks use one private application subnet, and RDS has one primary with no standby. The ALB spans two public subnets because its network requirements differ from the application placement. A two-AZ ALB and database subnet group do not make the backend or database highly available. RDS currently runs in a different AZ from the application; this can incur cross-AZ database transfer charges.

The [EC2 / Multi-AZ variant](../infra/ec2-multi-az/README.md) is a separate reference architecture with EC2-backed ECS capacity, Auto Scaling, a capacity provider, and a synchronous RDS standby. Its templates are locally validated; that variant has not been deployed. Both variants use the same production names and exports, so they are alternatives within one account and Region.

## Design decisions

| Decision                                      | Rationale                                                                                                  | Trade-off                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Fargate rather than EC2-backed ECS            | Removes host provisioning, agent maintenance, and capacity-provider administration from the hosted variant | Task compute is billed while running; no host-level access                              |
| Private tasks and database without NAT        | Isolates workload addresses and restricts service access through endpoints                                 | Interface endpoints have recurring charges; external API calls need another egress path |
| One CloudFront application origin             | Keeps static delivery and cookie-authenticated API requests on the same browser origin                     | ALB origin security and proxy trust still require separate controls                     |
| Static S3 frontend                            | Separates immutable frontend assets from application compute and avoids a frontend runtime container       | Upload ordering and cache policy correctness become deployment responsibilities         |
| Separate migration artifact and database user | Makes schema rollout explicit and keeps DDL privileges out of the backend                                  | Requires initial role provisioning and migration coordination                           |
| Independent CloudFormation stacks             | Separates resource lifecycles and makes dependencies reviewable                                            | Shared exports constrain update and teardown ordering                                   |
| Single-AZ application and database            | Reduces runtime footprint for portfolio hosting                                                            | Accepts AZ outage exposure and no database standby                                      |

## Deployment configuration

| Setting                 | Configuration                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Environment             | `prod`                                                                                     |
| AWS account             | `126571942046`                                                                             |
| Region                  | `eu-central-1` (Frankfurt)                                                                 |
| Application VPC         | `vpc-0c5fb02e41871d1d5`; `10.20.0.0/20`                                                    |
| CloudFront distribution | `E1Z2XZC6U9O5IJ`                                                                           |
| Public origin           | `https://d3avuxvegd3iy8.cloudfront.net`                                                    |
| ECS cluster             | `fit-track-prod-ecs-cluster-eu-central-1`                                                  |
| ECS backend service     | `fit-track-prod-backend-service-eu-central-1`                                              |
| Backend capacity        | One Fargate task; 256 CPU units (0.25 vCPU), 512 MiB; Linux `X86_64`                       |
| Migration capacity      | One-off Fargate task; 256 CPU units, 512 MiB; Linux `X86_64`                               |
| RDS instance            | `fit-track-prod-rds-eu-central-1`; PostgreSQL `17.11`, `db.t4g.micro`                      |
| RDS database            | `fittrack`; TCP 5432; private Single-AZ primary in `eu-central-1a`                         |
| Frontend bucket         | `fit-track-prod-frontend-126571942046-eu-central-1`                                        |
| DNS and viewer TLS      | AWS-provided CloudFront hostname and certificate; no custom domain or Route 53 hosted zone |

Identifiers describe this deployment. New accounts receive different IDs, ARNs, and endpoints; obtain them from stack outputs rather than copying resource IDs into a new deployment.

## CloudFormation stack boundaries

| Stack                      | Template                                                    | Owns                                                                                                | Imports from                                                |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `fit-track-prod-network`   | [network.yaml](../infra/fargate-single-az/network.yaml)     | VPC, five subnets, internet gateway, three route tables, routes and associations                    | None                                                        |
| `fit-track-prod-endpoints` | [endpoints.yaml](../infra/fargate-single-az/endpoints.yaml) | Six interface endpoints, S3 gateway endpoint, endpoint SG                                           | `network`                                                   |
| `fit-track-prod-compute`   | [compute.yaml](../infra/fargate-single-az/compute.yaml)     | ECS cluster and built-in Fargate capacity provider strategy                                         | None                                                        |
| `fit-track-prod-ecr`       | [ecr.yaml](../infra/fargate-single-az/ecr.yaml)             | Backend and migration repositories and image lifecycle rules                                        | None                                                        |
| `fit-track-prod-logs`      | [logs.yaml](../infra/fargate-single-az/logs.yaml)           | Backend and migration CloudWatch log groups                                                         | None                                                        |
| `fit-track-prod-ingress`   | [ingress.yaml](../infra/fargate-single-az/ingress.yaml)     | ALB SG, ALB, HTTP listener, IP target group                                                         | `network`                                                   |
| `fit-track-prod-frontend`  | [frontend.yaml](../infra/fargate-single-az/frontend.yaml)   | Private S3 bucket, bucket policy, OAC, CloudFront, SPA function, cache and response header policies | `ingress`                                                   |
| `fit-track-prod-service`   | [service.yaml](../infra/fargate-single-az/service.yaml)     | Backend service, two task definitions, execution roles, task SG, ALB and endpoint ingress rules     | `network`, `endpoints`, `compute`, `ecr`, `logs`, `ingress` |
| `fit-track-prod-database`  | [database.yaml](../infra/fargate-single-az/database.yaml)   | RDS instance, subnet group, TLS parameter group, RDS SG and task ingress                            | `network`, `service`                                        |

Imports and exports use `fit-track-${Environment}-<stack-key>-<output-logical-ID>`. For example, database imports `fit-track-prod-service-BackendTaskSecurityGroupId`. The deployed stack name is a convention; export names are built from `Environment`, not `AWS::StackName`.

Database exports its endpoint, port, database name, and administrator secret ARN for operational setup. These values are not imported back into `service`: database already depends on the service task SG. Runtime database URLs are supplied through externally managed secrets, keeping the stack dependency graph acyclic. The optional network `AvailabilityZoneAz1Name` output is preserved but is no longer imported for RDS placement.

Regional names and Name tags use `fit-track-${Environment}-<resource>-${AWS::Region}`. Global CloudFront names omit the Region; log groups and runtime secrets use paths; the ALB target group omits the Region from its physical name to satisfy the name length limit. Common tags are `Project=fit-track`, `Environment=prod`, `Component=<stack-key>`, and a descriptive `Name`.

## Network and private connectivity

### Subnets and routing

| Subnet            | CIDR           | AZ ID      | Deployed subnet            | Role                                      |
| ----------------- | -------------- | ---------- | -------------------------- | ----------------------------------------- |
| `PublicSubnetAz1` | `10.20.0.0/24` | `euc1-az1` | `subnet-0e0d371037652b85c` | ALB                                       |
| `PublicSubnetAz2` | `10.20.1.0/24` | `euc1-az2` | `subnet-0525e44a6d06236b8` | ALB                                       |
| `AppSubnetAz1`    | `10.20.2.0/24` | `euc1-az1` | `subnet-0371bf89a45dd2a70` | Fargate task ENIs and interface endpoints |
| `DbSubnetAz1`     | `10.20.4.0/24` | `euc1-az1` | `subnet-091d6665ca32c19db` | RDS placement option                      |
| `DbSubnetAz2`     | `10.20.5.0/24` | `euc1-az2` | `subnet-04c1da74332e154f2` | RDS placement option                      |

The VPC enables DNS support and DNS hostnames. Stable AZ IDs define subnet placement; account-specific AZ names can differ between accounts. `MapPublicIpOnLaunch=false` applies to every subnet. The internet-facing ALB manages its own public addresses, while tasks explicitly disable public IP assignment.

The public route table sends `0.0.0.0/0` to the internet gateway. Application and database route tables retain VPC-local routing without NAT or an internet default route. The application route table also associates the S3 gateway endpoint. No custom network ACLs or IPv6 VPC ranges are defined; security groups provide the workload access rules. CloudFront viewer IPv6 support is independent of the IPv4 origins.

### VPC endpoints

| Endpoint service                            | Type      | Purpose                                                     |
| ------------------------------------------- | --------- | ----------------------------------------------------------- |
| `com.amazonaws.eu-central-1.ecr.api`        | Interface | ECR authentication and image metadata                       |
| `com.amazonaws.eu-central-1.ecr.dkr`        | Interface | Docker registry API and image manifests                     |
| `com.amazonaws.eu-central-1.logs`           | Interface | ECS `awslogs` delivery                                      |
| `com.amazonaws.eu-central-1.secretsmanager` | Interface | Runtime credential retrieval at task startup                |
| `com.amazonaws.eu-central-1.ssm`            | Interface | Temporary EC2 administration through Systems Manager        |
| `com.amazonaws.eu-central-1.ssmmessages`    | Interface | Session Manager control and data channels                   |
| `com.amazonaws.eu-central-1.s3`             | Gateway   | Download image layers from the AWS-managed ECR layer bucket |

All interface endpoints use private DNS and one ENI in the application subnet. Fargate image pulls need both ECR endpoints and S3 access; ECR stores image layers in its own S3 bucket, distinct from the frontend bucket. The gateway policy permits only `s3:GetObject` on `prod-eu-central-1-starport-layer-bucket/*`. See [AWS ECR private endpoint requirements](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html).

The Logs endpoint policy permits `CreateLogStream` and `PutLogEvents`; its resource scope is broad, while task execution IAM policies restrict writes to each task's log group. Other interface endpoints use the default endpoint policy; IAM remains the authorization control. Endpoint policies constrain access rather than grant IAM permissions by themselves.

Fargate does not require customer-managed ECS agent endpoints. ECS Exec is disabled. SSM endpoints serve temporary administrative EC2 instances, not the backend process. They incur hourly charges even when no session is active. Private workloads cannot call arbitrary external APIs or download packages without adding a suitable egress path. The ECR-only S3 gateway policy does not cover the frontend bucket, SSM update packages, or administrative scripts.

### Security groups

| Destination                        | Allowed inbound | Source                                                     |
| ---------------------------------- | --------------- | ---------------------------------------------------------- |
| ALB SG `sg-0ffc7b1d4c638de32`      | TCP 80          | Managed CloudFront origin-facing prefix list `pl-a3a144ca` |
| Task SG `sg-0bac3287bdded2a29`     | TCP 3001        | ALB SG                                                     |
| Endpoint SG `sg-07e1bc6d35178c280` | TCP 443         | Task SG                                                    |
| RDS SG `sg-079eea7e43e2b6671`      | TCP 5432        | Task SG                                                    |

Each SG declares allow-all outbound IPv4 traffic. Private route tables still prevent arbitrary internet egress. Inbound rules are standalone CloudFormation resources; consumer stacks own cross-stack rules to keep imports one-way. Backend and migration tasks share the task SG, but use separate database users and execution roles.

Temporary database administration adds TCP 443 to the endpoint SG and TCP 5432 to the RDS SG from a dedicated EC2 SG. The administrative instance has been terminated; additional rules referencing `sg-086e8423d7e043154` remain outside the templates and require cleanup. They must not replace the task SG rules.

The CloudFront prefix list covers all CloudFront distributions. It restricts network sources but does not authenticate this distribution. The ALB has no distribution-specific origin header check. This is an explicit origin-access limitation.

## Frontend delivery and ingress

### CloudFront routing and caching

| Path                   | Origin                   | CloudFront cache          | Browser cache                       | Protocol                 |
| ---------------------- | ------------------------ | ------------------------- | ----------------------------------- | ------------------------ |
| Default frontend paths | Private S3 REST endpoint | Managed `CachingDisabled` | `Cache-Control: no-cache`           | HTTP redirected to HTTPS |
| `/assets/*`            | Private S3 REST endpoint | Custom fixed one-year TTL | `public,max-age=31536000,immutable` | HTTP redirected to HTTPS |
| `/api` and `/api/*`    | ALB                      | Managed `CachingDisabled` | Backend `Cache-Control: no-store`   | HTTPS required           |

The distribution uses `PriceClass_100`, HTTP/2 and HTTP/3, compression, the default root object `index.html`, and the AWS-provided certificate for its CloudFront hostname. It has no custom domain, ACM viewer certificate, WAF Web ACL, or access-log destination.

The API origin request policy is AWS-managed **AllViewer** (`216adef6-5c7f-47e4-b989-5492eafa07d3`), which forwards viewer headers, cookies, and query strings, including the viewer `Host`. Cookie forwarding preserves JWT authentication, and Origin forwarding supports CORS and CSRF checks. API methods include GET, HEAD, OPTIONS, POST, PUT, PATCH, and DELETE. See [managed origin request policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html).

CloudFront error TTLs are explicitly zero for supported configured 4xx and 5xx statuses, preserving origin status and body. This is separate from normal cache policies; S3 has a one-second minimum for error caching, and origin cache headers can affect error retention. API errors are not rewritten into the SPA document. See [CloudFront error caching](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/custom-error-pages-expiration.html).

### SPA routing and response headers

A viewer-request CloudFront Function uses the `cloudfront-js-2.0` JavaScript runtime. For GET and HEAD requests on extensionless frontend paths, it rewrites the URI to `/index.html` while preserving query parameters. Reserved `/api`, `/assets`, and `/brand` paths and file paths remain unchanged. React Router then resolves the page in the browser. The function runs only on the default behavior; cache behavior selection does not change when it rewrites the URI.

Frontend and asset response header policies enforce CSP, `nosniff`, framing restrictions, referrer policy, HSTS, permissions policy, and cross-origin opener/resource policy. CSP restricts scripts and API requests to the same origin; `theme-init.js` is an external static script. The two policies override browser `Cache-Control` values. CloudFront cache policies separately control edge TTLs, so this deployment does not require setting S3 object `Cache-Control` metadata during upload. API responses use the backend's Helmet and no-store headers, without a frontend response header policy.

### Private S3 origin

The frontend bucket blocks public access, uses bucket-owner-enforced ownership without ACLs, and encrypts objects with SSE-S3 (`AES256`). Versioning is enabled; noncurrent versions expire after 30 days, while current versions have no automatic expiry.

Origin Access Control always signs S3 requests with SigV4. The bucket policy grants `s3:GetObject` to CloudFront only when `AWS:SourceArn` matches this distribution, and denies insecure transport. CloudFront uses the regional S3 REST endpoint; S3 website hosting and CORS configuration are unnecessary for this same-origin path.

S3 contains the contents of `frontend/dist/`: `index.html`, hashed `/assets/` files, `theme-init.js`, and `/brand/` images. The frontend Nginx image remains a local/container deployment artifact; AWS serves these static files directly through S3 and CloudFront.

### ALB and target registration

The ALB is internet-facing across the two public subnets. Its HTTP port 80 listener forwards to `fit-track-prod-backend-tg`, an IP target group on TCP 3001. ECS registers and deregisters each task ENI's private IP as tasks are replaced; no fixed task address or EC2 target is configured.

The target group probes `/api/health/ready` every 30 seconds, expects HTTP 200, times out after five seconds, and uses two successful checks for healthy and three failures for unhealthy. Deregistration delay is 30 seconds. The ALB drops invalid header fields and uses defensive HTTP desynchronization mitigation.

TLS terminates at CloudFront. CloudFront-to-ALB and ALB-to-task traffic use HTTP; no ALB HTTPS listener or ACM origin certificate is configured. Browser HTTPS therefore does not establish end-to-end encryption through the API path. PostgreSQL connections use their own verified TLS configuration.

## ECS runtime and IAM

The compute stack creates an ECS cluster with built-in `FARGATE` capacity and weight 1. Fargate manages the underlying hosts; this variant defines no EC2 capacity, launch template, Auto Scaling group, or custom capacity provider.

| Concern       | Backend task                                                      | Migration task                             |
| ------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| Container     | `backend`                                                         | `migration`                                |
| Task family   | `fit-track-prod-backend-eu-central-1`                             | `fit-track-prod-migration-eu-central-1`    |
| Docker target | `production`                                                      | `migration`                                |
| Invocation    | Long-running ECS service                                          | One-off ECS `RunTask`                      |
| Platform      | Linux `X86_64`, `awsvpc`                                          | Linux `X86_64`, `awsvpc`                   |
| Default size  | 256 CPU units, 512 MiB                                            | 256 CPU units, 512 MiB                     |
| Stop timeout  | 30 seconds                                                        | 120 seconds                                |
| Health        | Process liveness container check and database readiness ALB check | Successful completion requires exit code 0 |
| Logs          | Non-blocking, 1 MiB buffer                                        | Blocking delivery                          |
| Secret keys   | `DATABASE_URL`, `JWT_SECRET`                                      | `DATABASE_URL`                             |

Each task definition contains one essential container and enables an init process. CPU/memory assertions reject unsupported combinations among the exposed parameter values. The backend listens on port 3001. Its container health check calls `127.0.0.1` inside the container; this address is intentionally independent of the public domain. Fargate ephemeral storage provides writable runtime space; no persistent volumes or bind mounts are configured.

The service uses rolling deployments with minimum healthy percent 100, maximum percent 200, and a 60-second health-check grace period. With desired count one, it can temporarily run two tasks during replacement. The circuit breaker enables rollback to an eligible previously completed deployment when startup or health checks fail; it is not a general recovery mechanism for every later application failure. See [ECS circuit breaker behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html).

Both task execution roles trust `ecs-tasks.amazonaws.com`. Permissions cover ECR authorization, image pulls scoped to the respective repository, log stream creation/event delivery scoped to the corresponding log group, and `GetSecretValue` scoped to the respective secret. ECR authorization requires `Resource: "*"`. No application task role is defined because the backend does not call AWS APIs. The task execution role retrieves startup resources on behalf of ECS; it does not grant the application administrative AWS access.

`NODE_ENV=production`, `PORT=3001`, `LOG_LEVEL=info`, `CLIENT_ORIGIN=https://d3avuxvegd3iy8.cloudfront.net`, and `TRUST_PROXY_HOPS=2` describe the CloudFront → ALB → Express path. Database pool defaults are five connections per backend process, a five-second connection timeout, and a 30-second idle timeout. Account for temporarily doubled task capacity when sizing the connection budget. Rate-limit counters remain process-local; scaling replicas does not create a shared limiter.

Service Auto Scaling and AZ rebalancing are not configured. Normal capacity is one task in the application AZ; zero is used during bootstrap or a deliberate pause. Before release CD, reconcile any Console capacity changes with the stored `BackendDesiredCount` parameter. The deployment scripts require a positive stored count equal to the live service desired count; they reject zero bootstrap capacity and capacity drift before creating a change set.

## Database and credentials

RDS provides PostgreSQL 17 on `db.t4g.micro` with 20 GiB encrypted gp3 storage. The database is private, has no standby or read replica, and uses a subnet group spanning two AZs. The template omits `AvailabilityZone`, allowing RDS to select available capacity from that group. The current primary is in `eu-central-1a`, while application tasks use `eu-central-1c`.

The PostgreSQL 17 parameter group sets `rds.force_ssl=1`. Automatic minor version upgrades are enabled; major upgrades, Enhanced Monitoring, and Performance Insights are disabled. Storage autoscaling and RDS Proxy are not configured. The ARM-based database instance is independent of the AMD64 application images.

Automated backups retain one day and expose a latest restorable time. RDS manages backup storage in AWS-managed S3; it is not the frontend bucket. Deletion protection is enabled, snapshots copy tags, and both CloudFormation deletion and replacement policies use `Snapshot`. `DeleteAutomatedBackups=false` preserves retained automated backups on deletion. Snapshot retention and automated-backup retention are separate; restore creates another database instance and requires validating its endpoint and credentials. Backup restore has not been exercised. See [RDS backup retention](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.BackupRetention.html).

RDS manages the `fittrack_admin` password in its own Secrets Manager secret. Two additional manually managed secrets contain application credentials:

| Secret name                | JSON keys                    | Execution role access |
| -------------------------- | ---------------------------- | --------------------- |
| `fit-track/prod/backend`   | `DATABASE_URL`, `JWT_SECRET` | Backend role only     |
| `fit-track/prod/migration` | `DATABASE_URL`               | Migration role only   |

The service template references their full deployment-specific ARNs in IAM policies and task `ValueFrom` values. Each selected JSON key uses the `:KEY::` ARN suffix. Secret names and ARNs are metadata; secret values stay outside CloudFormation, Git, and logs. Secrets use the default Secrets Manager encryption key; runtime credential automatic rotation is not configured. Switching to a customer-managed key requires corresponding decrypt permissions.

ECS injects secret values at task startup. Editing a secret requires replacement tasks or a forced deployment; it does not modify running processes. IAM permission to retrieve a secret, security group connectivity, PostgreSQL login privileges, and TLS verification are independent requirements. URL values must have no surrounding whitespace; validate the value consumed by the driver rather than relying only on a permissive URL parser.

### PostgreSQL bootstrap and runtime credentials

Run this bootstrap once on an empty `fittrack` database before the first Prisma migration. RDS manages `fittrack_admin`; application tasks use separate PostgreSQL login roles rather than the administrator credential. PostgreSQL roles are distinct from ECS IAM execution roles.

| PostgreSQL role      | Consumer                          | Permissions                                                                                                                                                                                                         |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fittrack_admin`     | Controlled initial administration | RDS-managed administrator; never injected into application tasks.                                                                                                                                                   |
| `fittrack_migration` | One-off migration task            | Owns schema `public` and objects it creates; can create and alter application tables, indexes, and types. No superuser, database creation, role creation, or replication privileges.                                |
| `fittrack_backend`   | Backend service                   | Connect to `fittrack`, use schema `public`, and select, insert, update, or delete application rows. Sequence usage and select permissions cover future sequence-backed keys. No schema creation or table ownership. |

#### Private administrative connection

Use a temporary EC2 instance in the project VPC with Amazon Linux 2023, an instance profile containing `AmazonSSMManagedInstanceCore`, no public IP, no inbound rules, and outbound IPv4 access. The endpoint SG must allow TCP 443 from the temporary instance SG; the RDS SG must additionally allow TCP 5432 from it. Preserve the existing task SG rules on both groups. EC2 and RDS must share the project VPC. SSM endpoints need private DNS; the instance must appear online in Systems Manager.

Install the Session Manager plugin and PostgreSQL client locally. Open a tunnel in one terminal, replacing the instance ID and endpoint with the deployed values:

```bash
aws ssm start-session \
  --region eu-central-1 \
  --target INSTANCE_ID \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["RDS_ENDPOINT"],"portNumber":["5432"],"localPortNumber":["15432"]}' \
  --no-cli-auto-prompt
```

Keep that terminal open. From the repository root in another terminal, connect with the RDS-managed administrator password entered at the prompt:

```bash
psql "host=RDS_ENDPOINT hostaddr=127.0.0.1 port=15432 dbname=fittrack user=fittrack_admin sslmode=verify-full sslrootcert=backend/certs/eu-central-1-bundle.pem connect_timeout=10"
```

`hostaddr` selects the local tunnel while `host` preserves RDS hostname verification. The local port is 15432; ECS database URLs use the actual RDS port 5432. Check TLS inside the session:

```sql
SELECT ssl, version, cipher
FROM pg_stat_ssl
WHERE pid = pg_backend_pid();
```

Require `ssl = true`. Do not put passwords in shell commands, SQL files, or repository documentation.

#### Initial roles and grants

At the `psql` prompt, run this meta-command separately and press Enter:

```text
\set ON_ERROR_STOP on
```

Then execute the SQL below. Do not repeat `CREATE ROLE` after successful bootstrap. If a statement fails, run `ROLLBACK;` before investigating; the transaction prevents partial bootstrap changes.

```sql
BEGIN;

CREATE ROLE fittrack_migration
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

CREATE ROLE fittrack_backend
  LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

REVOKE ALL ON DATABASE fittrack FROM PUBLIC;
GRANT CONNECT ON DATABASE fittrack
  TO fittrack_migration, fittrack_backend;

REVOKE ALL ON SCHEMA public FROM PUBLIC;

GRANT fittrack_migration TO fittrack_admin WITH SET TRUE;
GRANT CREATE ON DATABASE fittrack TO fittrack_migration;
ALTER SCHEMA public OWNER TO fittrack_migration;
REVOKE CREATE ON DATABASE fittrack FROM fittrack_migration;

GRANT USAGE ON SCHEMA public TO fittrack_backend;

ALTER ROLE fittrack_migration IN DATABASE fittrack
  SET search_path = public;
ALTER ROLE fittrack_backend IN DATABASE fittrack
  SET search_path = public;

SET ROLE fittrack_migration;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLES TO fittrack_backend;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT
  ON SEQUENCES TO fittrack_backend;

RESET ROLE;
REVOKE fittrack_migration FROM fittrack_admin;

COMMIT;
```

`PUBLIC` means every PostgreSQL role; it is distinct from schema `public`. Temporary database `CREATE` permission and administrator role membership allow schema ownership transfer and are removed before commit. The migration role retains ownership of `public`; the backend receives only schema usage and data permissions. Default privileges apply to future objects created by `fittrack_migration`, not other users. Changing schema ownership does not transfer existing table ownership. Existing databases need a separate ownership and permission review. See [PostgreSQL grants](https://www.postgresql.org/docs/17/sql-grant.html) and [default privileges](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html).

Generate two separate passwords locally, running this command once for each role:

```bash
openssl rand -hex 24
```

Set each password through its own interactive `psql` command:

```text
\password fittrack_migration
```

```text
\password fittrack_backend
```

Use the same respective passwords in the existing migration and backend secrets. No additional secret resource is needed solely for a password. Secrets Manager stores values; it does not set PostgreSQL role passwords automatically.

#### Secret configuration and migration order

Generate `JWT_SECRET` with `openssl rand -hex 32` and store it only in the backend secret. Keep it stable across ordinary deployments; rotation invalidates existing signed tokens. Runtime secret automatic rotation is not configured. Use the TLS URL formats in the next section, URL-encode non-hex passwords, and enter each URL as one line with no leading or trailing whitespace. Do not create extra Secrets Manager secrets for individual JSON keys.

Run the migration task with its dedicated credentials and confirm container exit code 0. Before starting the backend, connect as `fittrack_admin` and remove application access to Prisma's internal migration table:

```sql
BEGIN;
GRANT fittrack_migration TO fittrack_admin WITH SET TRUE;
SET ROLE fittrack_migration;
REVOKE ALL ON TABLE public."_prisma_migrations"
  FROM fittrack_backend;
RESET ROLE;
REVOKE fittrack_migration FROM fittrack_admin;
COMMIT;
```

This is required after first migration because default table grants also cover `_prisma_migrations`. Ordinary later migrations do not restore its revoked grants; review permissions if the table is recreated.

Set backend desired count to one and verify ALB readiness health and the API through CloudFront. ECS reads secret values at task startup; after editing a secret, start a new deployment. A secret-only update does not require rebuilding the image. Preserve deployed and rollback ECR digests. After successful bootstrap and backend verification, terminate the temporary EC2 instance and remove only its administrative ingress rules; keep task access rules.

### Runtime database TLS configuration

The public Frankfurt RDS CA bundle is versioned in `backend/certs/eu-central-1-bundle.pem` and copied into both production and migration images. It contains CA certificates, not private keys or application credentials. Update it from the [official RDS certificate bundles](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html) when required for certificate rotation.

Populate the backend secret’s `DATABASE_URL` with the dedicated backend user and the actual RDS endpoint:

```text
postgresql://BACKEND_USER:URL_ENCODED_PASSWORD@RDS_ENDPOINT:5432/fittrack?sslmode=verify-full&sslrootcert=/user/src/app/backend/certs/eu-central-1-bundle.pem
```

The backend’s Prisma adapter uses node-postgres, which reads `sslrootcert` as the trusted CA and verifies the certificate and hostname with `sslmode=verify-full`. Do not add `sslcert` to this URL: node-postgres treats that parameter as a client certificate. See [node-postgres TLS configuration](https://node-postgres.com/features/ssl).

Populate the migration secret’s `DATABASE_URL` with the migration user and Prisma CLI’s TLS parameters:

```text
postgresql://MIGRATION_USER:URL_ENCODED_PASSWORD@RDS_ENDPOINT:5432/fittrack?sslmode=require&sslcert=/user/src/app/backend/certs/eu-central-1-bundle.pem&sslaccept=strict
```

Prisma Migrate uses its own connector: `sslcert` supplies the server CA, and `sslaccept=strict` enables certificate validation, including hostname checks. Its documented SSL modes differ from node-postgres. See [Prisma PostgreSQL TLS parameters](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).

Use the RDS DNS endpoint, not an IP address or custom alias. URL-encode credentials. Local Compose keeps its existing connection settings. Runtime readiness confirms database connectivity with the configured backend URL; negative tests for an incorrect CA, incorrect hostname, and plaintext rejection are not recorded for this AWS deployment.

## Container registry and image identity

The release workflow targets two ECR artifacts: `fit-track-prod-backend-eu-central-1` and `fit-track-prod-migration-eu-central-1`. Both repositories use AES256 encryption and immutable tags, with mutable exceptions for `main` and `latest`. ECS references `repository-uri@sha256:...` through `BackendImageDigest` and `MigrationImageDigest`; a commit identifies source, while a digest identifies registry content.

Build from the repository root for `linux/amd64`, matching task definitions. The backend Dockerfile supplies the `production` and `migration` targets. SBOM and provenance attestations can produce additional manifest entries alongside the runnable image; their presence does not mean ECS runs multiple containers. The static frontend is uploaded separately and does not require an ECR repository. The main workflow builds and smoke-tests images in GHCR. The release workflow waits for successful publication of the exact tagged commit, smoke-tests its images, and copies the backend and migration OCI indexes to ECR without rebuilding. ECR tags use `MAJOR.MINOR.PATCH`; destination digests must equal the source digests, preserving the runnable image and its SBOM/provenance manifests. A matching existing version tag is reused on retries; conflicting content fails publication. A GitHub-hosted run is still required to verify automated ECR publication. See [Docker index copying](https://docs.docker.com/reference/cli/docker/buildx/imagetools/create/). The following commands remain available for manual publication:

```bash
aws ecr get-login-password --region eu-central-1 --no-cli-auto-prompt \
  | docker login --username AWS --password-stdin 126571942046.dkr.ecr.eu-central-1.amazonaws.com

IMAGE_TAG="$(git rev-parse HEAD)"

docker buildx build --platform linux/amd64 \
  --file backend/Dockerfile --target production \
  --tag "126571942046.dkr.ecr.eu-central-1.amazonaws.com/fit-track-prod-backend-eu-central-1:$IMAGE_TAG" \
  --sbom=true --provenance=mode=max --push .

docker buildx build --platform linux/amd64 \
  --file backend/Dockerfile --target migration \
  --tag "126571942046.dkr.ecr.eu-central-1.amazonaws.com/fit-track-prod-migration-eu-central-1:$IMAGE_TAG" \
  --sbom=true --provenance=mode=max --push .

aws ecr describe-images --region eu-central-1 \
  --repository-name fit-track-prod-backend-eu-central-1 \
  --image-ids imageTag="$IMAGE_TAG" \
  --query 'imageDetails[0].imageDigest' --output text \
  --no-cli-auto-prompt --no-cli-pager
```

Query the migration repository identically for its digest. Use a new tag for changed content; immutable tags reject replacement. Each repository expires images beyond the ten most recently pushed images. This lifecycle rule does not check ECS references, so preserve current and rollback content before relying on retention during frequent builds. Retaining the repository does not prevent lifecycle expiration.

### Regional ECR scanning

Registry scanning is configured outside CloudFormation because it is shared account/Region configuration. BASIC scan-on-push selects `fit-track-prod-*`; unmatched repositories use manual scanning. The ECR stack exports the account ID as `EcrRegistryId` and manages only repositories.

```bash
aws ecr get-registry-scanning-configuration \
  --region eu-central-1 --no-cli-auto-prompt
```

Review scan findings for the pushed images before deployment. Successful image publication or configured scanning does not establish that an image has no vulnerabilities. Changing regional rules must account for other repositories; deleting the project stack does not remove this configuration.

## Deployment procedure

Initial infrastructure provisioning and frontend publication use the AWS CLI and Console. The release workflow publishes images and then runs backend CD: two image-only CloudFormation service-stack updates, a dedicated migration task, and verification of the requested backend revision. It does not provision infrastructure stacks, upload frontend files, or perform vulnerability scan gating. Backend CD has local mocked regression coverage; a successful production workflow is still required to verify its IAM permissions and AWS runtime behavior. Use an authenticated local AWS profile for manual operations and specify `eu-central-1` explicitly; credentials never belong in the repository.

### GitHub Actions AWS authentication

The release image job grants `id-token: write` and uses `aws-actions/configure-aws-credentials` to obtain temporary credentials through `sts:AssumeRoleWithWebIdentity`. The GitHub `production` environment variables supply `AWS_ECR_PUBLISH_ROLE_ARN` (`arn:aws:iam::126571942046:role/fit-track-gha-ecr-publish`) and `AWS_REGION` (`eu-central-1`). The action verifies the expected account is `126571942046`, requests a one-hour session, and identifies it with `fit-track-ecr-<run-id>`. `aws-actions/amazon-ecr-login` then authenticates Docker to ECR. Both AWS actions are pinned to commit SHAs.

The release job declares `environment: production`. The role must trust the GitHub OIDC provider using `StringEquals` for both audience `sts.amazonaws.com` and subject `repo:jakobzagar/Fit-Track:environment:production`. In the GitHub environment settings, select **Selected branches and tags** and allow only a **Tag** rule matching `v*.*.*`; do not add a branch rule for `main`. GitHub enforces the tag restriction because the environment-based OIDC subject does not contain the Git ref. Any configured environment approval applies before the job starts. Image publication permissions are scoped to the backend and migration ECR repositories, with registry authentication requiring `ecr:GetAuthorizationToken` on `*`. IAM and GitHub environment configuration must match the workflow before publication can succeed; repository changes do not create or update these external settings. The backend deployment job uses a separate deployment role with the same production-environment OIDC subject.

OIDC and ECR login failures stop release publication to ECR. No stored AWS access keys are required. The workflow copies backend and migration from GHCR to ECR and verifies their registry digests. A successful GitHub-hosted run is required to verify federation, registry login, and publication. Backend rollout runs in the separate deployment job described below; automated vulnerability scan gating remains unimplemented. ECR immutable version tags are reused only when they already match the source digest; conflicting content fails rather than replacing a release.

### Release backend CD

The `deploy-backend` job in `.github/workflows/release.yaml` depends on successful `release-images` publication and receives its backend and migration OCI index digests through job outputs. It uses `environment: production`; configured environment approval occurs before the job starts. One workflow-level concurrency group serializes image publication and backend deployment together; running releases are not cancelled by a newer release. GitHub concurrency does not guarantee FIFO processing of pending releases.

Configure these additional variables in the `production` environment:

| Variable                   | Value                                                            |
| -------------------------- | ---------------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`      | `arn:aws:iam::126571942046:role/fit-track-gha-deploy`            |
| `AWS_CFN_SERVICE_ROLE_ARN` | `arn:aws:iam::126571942046:role/fit-track-prod-service-cfn-role` |

The GitHub deployment role prepares, describes, executes, and deletes change sets for `fit-track-prod-service`, reads the service/compute stack outputs, runs the migration task in the production cluster, and monitors tasks and the backend service. Its `iam:PassRole` permissions cover only the CloudFormation execution role and migration task execution role, restricted to their receiving AWS services. The CloudFormation execution role trusts `cloudformation.amazonaws.com` and registers application task definitions, passes their existing execution roles to ECS, updates the existing backend service, manages ECS tags, and deregisters replaced definitions. These roles do not retrieve runtime secret values. Their Console-managed policies must be configured before the job runs; the workflow does not create IAM roles.

The scripts under `scripts/deploy/` execute this sequence:

1. `update-service-stack.sh migration` reads the existing stack and checks that `BackendDesiredCount` is positive and that live capacity matches the stored parameter. AWS rejects updates when the stack is busy. It creates an UPDATE change set using `--use-previous-template`, the explicit CloudFormation execution role, `CAPABILITY_NAMED_IAM`, the new migration digest, and `UsePreviousValue=true` for every other parameter.
2. The AWS CLI waiter waits for preparation. The script prints a short resource-change summary, executes that exact change set, and waits for stack completion. The following migration step checks the stored migration digest before starting a task. There is no additional resource-change filter; rollout scope comes from reusing the deployed template, changing one parameter, and the execution role permissions.
3. `run-migration.sh` resolves the migration task definition from the service stack and the cluster from compute. It reuses the backend service’s subnet and security group configuration, explicitly disables a public IP, starts one Fargate task, waits for it to stop, and requires the migration container to report exit code `0`. ECS launch failures and a missing exit code are failures.
4. `update-service-stack.sh backend` repeats the parameter-preserving update with the new backend digest. The existing template links that parameter to `BackendTaskDefinition` and the backend service; all other parameter values remain unchanged.
5. `verify-backend.sh` checks the requested stack digest, uses the AWS service-stability waiter, and requires the service to use the task definition exported by the updated stack, with a positive desired count and completed rollout state. A stable service rolled back to an old definition fails this check.

AWS validates and executes the change set after environment approval; the job does not pause for a separate human review or apply a custom resource whitelist. General infrastructure changes remain a separate reviewed deployment procedure. The deployed template is reused, so merging template edits alone does not apply them through release CD. The restricted execution role covers image rollouts on the existing stack, not first-time creation, deletion, or IAM/SG changes. Once assigned, CloudFormation retains that service role for later operations; choose an appropriately authorized execution role for broader infrastructure maintenance. See [CloudFormation service roles](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-iam-servicerole.html) and [parameter preservation](https://docs.aws.amazon.com/cli/latest/reference/cloudformation/create-change-set.html).

If the stable stack already stores the requested digest, the update is skipped before a change set is created. Otherwise, AWS CLI waiters handle preparation and execution failures. Retries can therefore resume image updates; Prisma `migrate deploy` handles already applied migrations. A migration failure prevents the backend update, but completed schema changes are not automatically rolled back. Keep migrations compatible with the previous backend revision. The backend circuit breaker can roll back the application; it cannot undo database changes.

The job has a 55-minute timeout within the default one-hour AWS session. A cancelled/timed-out job does not undo an accepted CloudFormation operation or stop a running migration task. Inspect the stack and migration task before retrying if their terminal status was not observed. Verification covers ECS deployment completion and configured task/ALB health checks; it does not perform public CloudFront health requests, authenticated browser journeys, or a frontend rollout. Frontend S3 publication and CloudFront invalidation remain manual.

### Planned infrastructure and frontend CD

Initial stack provisioning and template changes still require reviewed change sets outside the release image rollout. Future CD can add explicit human review between infrastructure change-set preparation and execution, frontend publication from the matching release revision to S3, CloudFront invalidation, and scan gating. Database bootstrap, runtime secret values, and infrastructure lifecycle operations remain separate from application releases.

### First deployment

1. Validate templates with `npm run infra:check` and confirm account permissions, quotas, service availability, and charges.
2. Deploy `network`, `compute`, `ecr`, and `logs`; these stacks are independent.
3. Deploy `endpoints` and `ingress` after `network`, then `frontend` after `ingress`.
4. Build and push backend and migration images; obtain both digests. Create the two runtime secrets with their required JSON keys, and set their full ARNs in the service template. Database URLs can be populated once RDS exists; keep backend capacity zero meanwhile.
5. Deploy `service` with `BackendDesiredCount=0`, both image digests, and `ClientOrigin` equal to the frontend HTTPS origin. This creates the task SG needed by database without starting the API prematurely.
6. Deploy `database`, obtain its endpoint and administrator secret, and follow the PostgreSQL bootstrap procedure. Populate the runtime URLs and backend JWT secret outside CloudFormation.
7. Run the migration task and require exit code zero. Remove backend access to `_prisma_migrations`.
8. Update `service` with `BackendDesiredCount=1`, preserving the image and origin parameters. Upload the frontend build, then verify the service, target group, and public application.
9. Terminate temporary administrative EC2 capacity and remove its additional SG rules after verification.

A change set separates preparation from execution. For example, prepare a network deployment without executing it:

```bash
aws cloudformation deploy \
  --region eu-central-1 \
  --stack-name fit-track-prod-network \
  --template-file infra/fargate-single-az/network.yaml \
  --parameter-overrides Environment=prod \
  --tags Project=fit-track Environment=prod Component=network \
  --no-execute-changeset --no-fail-on-empty-changeset \
  --no-cli-auto-prompt
```

Review the generated change set for deletions, replacements, IAM changes, security group changes, and data lifecycle effects before executing it in CloudFormation or with `execute-change-set`. Wait for stack completion and inspect events on failure. The service stack creates named IAM roles and requires `--capabilities CAPABILITY_NAMED_IAM`. Change sets describe proposed resource changes; they do not prove application health or safe schema compatibility.

### Migration execution

Run the deployed migration task definition in the application subnet with the task SG and no public IP. Resolve `MigrationTaskDefinitionArn`, `EcsClusterArn`, `AppSubnetAz1Id`, and `BackendTaskSecurityGroupId` from their owning stack outputs. An equivalent request for this deployment is:

```bash
aws ecs run-task \
  --region eu-central-1 \
  --cluster fit-track-prod-ecs-cluster-eu-central-1 \
  --task-definition fit-track-prod-migration-eu-central-1 \
  --capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --network-configuration 'awsvpcConfiguration={subnets=[subnet-0371bf89a45dd2a70],securityGroups=[sg-0bac3287bdded2a29],assignPublicIp=DISABLED}' \
  --count 1 --no-cli-auto-prompt
```

Inspect response `failures`, capture the returned task ARN, wait for `STOPPED`, and inspect container exit code and migration logs. `EssentialContainerExited` with exit code zero is normal for this one-off process. Do not run migrations concurrently or route traffic to a backend revision before its required migration succeeds. Prefer schema changes compatible with the previous backend during rolling replacement; the ECS circuit breaker cannot undo a database migration.

### Static frontend publication

Build with a same-origin API configuration; do not bake localhost API addresses into the production frontend. Review untracked `frontend/.env` values before building. Publish hashed assets before the HTML that references them:

```bash
npm run build:frontend

aws s3 sync frontend/dist/ \
  s3://fit-track-prod-frontend-126571942046-eu-central-1/ \
  --exclude index.html --region eu-central-1 --no-cli-auto-prompt

aws s3 cp frontend/dist/index.html \
  s3://fit-track-prod-frontend-126571942046-eu-central-1/index.html \
  --region eu-central-1 --no-cli-auto-prompt

aws cloudfront create-invalidation \
  --distribution-id E1Z2XZC6U9O5IJ \
  --paths /index.html /theme-init.js '/brand/*' \
  --no-cli-auto-prompt
```

Response header policies supply browser cache directives; CloudFront policies supply edge TTLs. Upload commands therefore need no `--cache-control`. Keep previous hashed assets available for already-open browsers and rollback; these commands intentionally do not delete old files. Current objects have no expiry, so obsolete assets require deliberate cleanup. An invalidation does not clear browser caches. Hashed asset names change with content; default paths have edge caching disabled and browser revalidation enabled.

### Application updates

Validate and publish the selected revision, update task definitions using exact ECR digests, run required migrations once, and apply a service change set. Preserve `ClientOrigin`, runtime sizing, and desired count explicitly. ECS replaces tasks, verifies health, and deregisters old targets. Publish the matching frontend build and check authenticated browser flows. Secret changes require replacement tasks; image rebuilds are unnecessary when only credentials change.

Do not mix untracked Console capacity changes with a contradictory CloudFormation parameter. A forced deployment can refresh secrets, but does not reconcile `BackendDesiredCount` in the stack. Record the intended capacity in CloudFormation before subsequent infrastructure updates.

## Logging and verification

Pino writes structured JSON to stdout/stderr in production. Request logs carry a request ID, method, path, status, and duration; sensitive headers and credentials are redacted. Readiness failures report sanitized database diagnostics. Successful health probes log at debug level and are omitted at the configured info level.

The ECS `awslogs` driver sends backend output to `/fit-track/prod/backend` and migration output to `/fit-track/prod/migration`, with separate stream prefixes and seven-day retention. Log groups use AWS-managed encryption rather than a customer-managed KMS key. Retain policies preserve the groups during stack deletion; they do not override event expiry. Container Insights, application alarms, distributed tracing, ALB access logs, and CloudFront access logs are not configured.

| Verification surface | Observed result                                                                             | Scope                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| CloudFormation       | All nine stacks completed creation or update                                                | Confirms stack operations, not every application behavior    |
| Private endpoints    | Required endpoints available with expected subnet and DNS configuration                     | No arbitrary internet egress tested or provided              |
| ECS backend          | One running task; deployment completed; ALB target healthy                                  | Recorded capacity drift must be reconciled before release CD |
| Migration            | Essential container completed with exit code 0                                              | Confirms migration task completion                           |
| Public frontend      | CloudFront HTTPS response 200 with frontend security and cache headers                      | Does not independently prove every browser journey           |
| Public readiness     | `/api/health/ready` returned 200 and `status=ready`                                         | Confirms API routing and database connectivity               |
| RDS                  | Private encrypted Single-AZ instance available; backups enabled and restorable time present | Restore and TLS negative tests not exercised                 |
| Logs                 | Both task log groups configured with seven-day retention                                    | Delivery observed; no alerting pipeline                      |
| Local validation     | Formatting and cfn-lint cover both template variants                                        | Does not prove reference variant deployability               |

Useful read-only checks:

```bash
aws ecs describe-services --region eu-central-1 \
  --cluster fit-track-prod-ecs-cluster-eu-central-1 \
  --services fit-track-prod-backend-service-eu-central-1 \
  --no-cli-auto-prompt

aws cloudformation describe-stacks --region eu-central-1 \
  --stack-name fit-track-prod-service --no-cli-auto-prompt

curl --fail --silent --show-error \
  https://d3avuxvegd3iy8.cloudfront.net/api/health/ready
```

The deployment has verified serving and database connectivity. It does not establish high availability, load capacity, disaster recovery, complete cloud browser regression coverage, or distribution-exclusive ALB access.

## Resource lifecycle and cost

| Resource                         | Deletion policy        | Replacement policy     | Operational effect                                                            |
| -------------------------------- | ---------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| S3 bucket                        | Retain                 | Retain                 | Preserves objects and versions; bucket policy is deleted separately           |
| ECR repositories                 | Retain                 | Retain                 | Preserves images subject to lifecycle expiration                              |
| CloudWatch log groups            | Retain                 | Retain                 | Preserves groups; seven-day event expiry continues                            |
| RDS instance                     | Snapshot               | Snapshot               | Preserves a snapshot; disable deletion protection before teardown             |
| Other Fargate template resources | Delete                 | Delete                 | Removes network, endpoints, runtime, IAM, ingress, and frontend configuration |
| Manually managed runtime secrets | Outside CloudFormation | Outside CloudFormation | Requires separate retention and cleanup decisions                             |

RDS has `DeleteAutomatedBackups=false`; retained backups and final snapshots require separate cleanup. Its managed administrator secret follows the RDS lifecycle, rather than the manual runtime secret lifecycle. Store recoverable credentials securely before database removal. Retained resources cannot be automatically adopted by a newly created stack with the same names; import supported resources or deliberately remove them. Retention does not prevent user deletion, lifecycle expiry, or data loss within an active resource.

Delete consumers before their producers: `database` before `service`; `service` before `compute`, `ecr`, `logs`, `ingress`, and `endpoints`; `frontend` before `ingress`; `endpoints` and `ingress` before `network`. Take recovery copies and review imports, replacement effects, and fixed names first. See [CloudFormation deletion policies](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-attribute-deletionpolicy.html).

Scaling the backend to zero pauses the API but leaves RDS, ALB, endpoint ENIs, storage, and secrets provisioned. Fargate is billed while tasks run; ALB and interface endpoints have ongoing capacity charges. RDS, snapshots, backups beyond applicable allowances, ECR/S3 storage, CloudWatch ingestion and retention, Secrets Manager, and data transfer can also incur charges. The S3 gateway endpoint has no endpoint hourly charge. A free-plan account or credits do not make this architecture inherently free. Check current account allowances and billing rather than assuming a fixed monthly cost.

## Accepted limits and deployment portability

- One application AZ and a Single-AZ database provide no standby workload or database failover architecture. The two-AZ ALB does not remove this limitation.
- API origin traffic uses HTTP. The CloudFront prefix list permits other distributions, with no distribution-specific origin authentication.
- Process-local rate limiting, one task, and no Service Auto Scaling limit scaling guarantees.
- Backup configuration is present, but restore execution and recovery objectives are not validated. One-day retention is a cost-oriented setting.
- Backend release CD is implemented with mocked local validation; successful production execution is not yet recorded. Infrastructure provisioning, template changes, and frontend publication remain manual. Environment approval is separate from reviewing a prepared change set; migrations have no automatic rollback.
- Runtime secret rotation, WAF, metrics alarms, and tracing are not implemented. Temporary administration rules and desired-count drift require reconciliation.
- Names use Region substitution, but AZ IDs, the CloudFront prefix list, CA bundle, and runtime secret ARNs bind the templates to this deployment. Review them before using another account or Region.

These limits define the hosted portfolio deployment. The EC2 / Multi-AZ templates demonstrate a different availability and capacity model without claiming that those resources or failover procedures have been exercised on AWS.
