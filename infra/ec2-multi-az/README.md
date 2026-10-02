# EC2 / Multi-AZ infrastructure

CloudFormation templates are grouped by independently deployed stack and lifecycle. Each stack lives in its own `<stack-key>.yaml` file under `infra/ec2-multi-az/`; stack-specific parameters and resources stay together. AWS architecture, decisions, deployment state, and verification are tracked in [the AWS deployment plan](../../docs/aws-deployment-plan.md).

It uses EC2-backed ECS capacity across two Availability Zones and a private Multi-AZ RDS instance. The separate [Fargate / Single-AZ variant](../fargate-single-az/README.md) is being prepared for deployment. These directories are alternative architectures, not staging and production environments.

## Stack boundaries

| Stack       | CloudFormation stack name  | Template                         | Owns                                                                                                                                  | Depends on                                     |
| ----------- | -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `network`   | `fit-track-prod-network`   | [network.yaml](network.yaml)     | VPC, six subnets, internet gateway, route tables, public route                                                                        | None                                           |
| `endpoints` | `fit-track-prod-endpoints` | [endpoints.yaml](endpoints.yaml) | ECR/ECS/SSM/Secrets Manager/CloudWatch Logs interface endpoints, S3 gateway endpoint, endpoint security group                         | `network`                                      |
| `compute`   | `fit-track-prod-compute`   | [compute.yaml](compute.yaml)     | ECS cluster, capacity provider, EC2 Auto Scaling group, instance role/profile/security group                                          | `network`, `endpoints`                         |
| `ecr`       | `fit-track-prod-ecr`       | [ecr.yaml](ecr.yaml)             | Backend and migration repositories; BASIC scan-on-push; retain 10 newest images                                                       | None                                           |
| `logs`      | `fit-track-prod-logs`      | [logs.yaml](logs.yaml)           | Backend and migration CloudWatch Logs groups with 30-day retention                                                                    | None                                           |
| `ingress`   | `fit-track-prod-ingress`   | [ingress.yaml](ingress.yaml)     | ALB, HTTP listener, backend IP target group, and CloudFront-facing security group                                                     | `network`                                      |
| `service`   | `fit-track-prod-service`   | [service.yaml](service.yaml)     | ECS backend service and task definitions, migration task, IAM roles, runtime secrets, and backend task networking                     | `network`, `compute`, `ingress`, `ecr`, `logs` |
| `database`  | `fit-track-prod-database`  | [database.yaml](database.yaml)   | Private Multi-AZ PostgreSQL instance with one standby, TLS parameter group, subnet group, and task-restricted database security group | `network`, `service`                           |
| `frontend`  | `fit-track-prod-frontend`  | [frontend.yaml](frontend.yaml)   | Private frontend bucket, OAC, CloudFront distribution, and API routing; SPA rewrite and frontend response headers                     | `ingress`                                      |

## Deployment dependencies

A valid creation order is:

1. `network`, `ecr`, and `logs` (independent stacks).
2. `endpoints` and `ingress` after `network`.
3. `compute` after `endpoints`, created with `CapacityMode=bootstrap`; `frontend` after `ingress`. Activate the completed compute stack with `CapacityMode=active` and verify instance registration before running tasks, following the linked AWS bootstrap procedure.
4. `service` after `network`, `compute`, `ingress`, `ecr`, and `logs`, initially with `BackendDesiredCount=0`.
5. `database` after `service`, because its security group imports the service task security group.

The [AWS bootstrap procedure](../../docs/aws-deployment-plan.md#backend-service-scheduling-and-deployment) owns image digests, secrets, database setup, migration execution, and starting backend tasks. Set `ClientOrigin` to the frontend HTTPS URL. Stack creation order alone does not make the application ready.

Delete consumers before producers: `database` before `service`; `service` before `compute`, `ingress`, `ecr`, and `logs`; `frontend` before `ingress`; `compute` before `endpoints`; `ingress` and `endpoints` before `network`. Review retained data and deletion protection in the [AWS plan](../../docs/aws-deployment-plan.md#cost-and-lifecycle-direction) before teardown.

The ECR scanning configuration manages the whole regional registry, although its filter selects only the FitTrack repositories. Check existing registry settings before deployment.

## Cross-stack contracts

Deploy stacks as `fit-track-${Environment}-<stack-key>`. Imports and exports both use `fit-track-${Environment}-<stack-key>-<output-logical-ID>`, independently of the actual stack name. `Environment` currently allows only `prod`. No stack-name parameters are required.

The current physical names and export prefixes are not variant-specific. Deploy only one variant in a given account and Region with these names; parallel deployment requires distinct physical names and export namespaces, including registry-scanning ownership. Exports are unique within an account and region, and consumers must be in that same account and region. CloudFormation prevents changing or deleting an export while another stack imports it. Database outputs must not be imported into `service`: `database` already imports its task security group, so that would create a dependency cycle. Database URLs are configured through secret values outside CloudFormation.

`compute` owns HTTPS ingress to the endpoint SG from the EC2 instance SG. `service` owns ALB-to-task ingress on TCP 3001. `database` owns task-to-database ingress on TCP 5432. These rules keep imports one-way; all workload security groups allow outbound IPv4 traffic.

## Local checks

Run `npm run infra:check` before a template change is handed off. See [infrastructure validation](../../docs/testing.md#infrastructure-validation) for prerequisites and the limits of local checks. No stack deployment or AWS runtime verification is established by this command.

## Resource naming

Regional resource names and Name tags use `fit-track-${Environment}-<resource>-${AWS::Region}`. S3 bucket names additionally include `${AWS::AccountId}` for global uniqueness. Region-scoped secrets and log groups keep their path names, and cross-stack exports retain `fit-track-${Environment}-<stack-key>-<output-logical-ID>`. IAM managed-policy ARNs use `${AWS::Partition}`. Global CloudFront resource names have no regional suffix. The ALB target group's physical name omits the region to stay within its 32-character limit; its Name tag includes the region.

The selected deployment Region remains `eu-central-1`. Network AZ IDs `euc1-az1` and `euc1-az2`, ingress CloudFront prefix-list ID `pl-a3a144ca`, and the bundled RDS CA certificates are region-specific. Dynamic names alone do not make these stacks deployable in another Region; validate or change these settings first.
