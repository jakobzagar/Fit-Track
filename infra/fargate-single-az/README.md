# Fargate / Single-AZ infrastructure

This is the deployment architecture intended for actual application hosting on the project's AWS free-plan account. It reduces the infrastructure footprint and operational work through ECS Fargate in one private application subnet, one backend task, and a private Single-AZ RDS PostgreSQL instance. The logs and endpoints templates are present; other stacks are not yet implemented. Architecture decisions, implementation state, and verification belong in the [AWS deployment plan](../../docs/aws-deployment-plan.md).

The [EC2 / Multi-AZ variant](../ec2-multi-az/README.md) preserves the advanced reference templates for demonstrating AWS infrastructure design, managed EC2 capacity, and Multi-AZ availability. The two directories represent alternative architectures, not staging and production environments. Single-AZ describes application task placement and the database instance; the ALB and RDS subnet group still require subnets in two Availability Zones.

## Implemented templates

| Template                         | Resources and contracts                                                                                                                                                                                                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [logs.yaml](logs.yaml)           | Backend and migration log groups, 30-day retention, and exported names/ARNs.                                                                                                                                                                                                                 |
| [endpoints.yaml](endpoints.yaml) | Six interface endpoints in `AppSubnetAz1Id`: ECR API, ECR DKR, CloudWatch Logs, Secrets Manager, SSM, and SSM Messages. S3 gateway access is limited to regional ECR image layers and attached to `AppRouteTableId`. Exports the seven endpoint IDs and `InterfaceEndpointsSecurityGroupId`. |

The endpoint stack imports `VpcId`, `AppSubnetAz1Id`, and `AppRouteTableId` from the future network stack. The endpoint SG currently has no ingress rule; the service stack must add TCP 443 ingress from the Fargate task SG before starting tasks. SSM and SSM Messages support a temporary private EC2 administration instance for RDS setup through Session Manager port forwarding. That instance requires an SSM instance profile, TCP 443 access to the endpoint SG, and TCP 5432 access to the RDS SG; the administration instance and its rules are not yet defined. Use SSM Agent 3.3.40.0 or newer, which prefers `ssmmessages`; the legacy `ec2messages` endpoint is omitted. ECS control-plane endpoints remain omitted and ECS Exec remains disabled. The S3 gateway still permits only ECR layers, so SSM Agent updates and S3-based administration scripts require separate scoped access. See [AWS Fargate endpoint requirements](https://docs.aws.amazon.com/AmazonECR/latest/userguide/vpc-endpoints.html).

Local formatting and cfn-lint validation pass. Network exports, task networking, AWS resource creation, and private endpoint connectivity remain unverified.

## Planned stack boundaries

| Stack       | Responsibility                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `network`   | VPC, two public ALB subnets, one private application subnet, two private database subnets, internet gateway, and route tables; no NAT gateway.             |
| `endpoints` | ECR API, ECR DKR, CloudWatch Logs, Secrets Manager, SSM, and SSM Messages interface endpoints in the application AZ; S3 gateway endpoint for image layers. |
| `compute`   | ECS cluster using Fargate; no EC2 instances, launch template, Auto Scaling group, or EC2 capacity provider.                                                |
| `ecr`       | Backend and migration image repositories and image lifecycle settings.                                                                                     |
| `logs`      | Backend and migration CloudWatch Logs groups.                                                                                                              |
| `ingress`   | ALB, HTTP listener, backend IP target group, and CloudFront-facing security group.                                                                         |
| `service`   | One backend Fargate task, one-off migration task definition, execution roles, runtime secrets, and task security group.                                    |
| `database`  | Private Single-AZ PostgreSQL instance, TLS parameter group, two-AZ subnet group, and task-restricted security group.                                       |
| `frontend`  | Private S3 bucket, CloudFront OAC and distribution, API routing, SPA navigation, cache policies, and response headers.                                     |

## Deployment and validation

Deployment dependencies and exact resource names will be documented alongside the implemented templates. Database users and grants must be prepared before migrations and backend startup; runtime secret values stay outside CloudFormation and the repository.

Run `npm run infra:check` after adding or changing templates. See [infrastructure validation](../../docs/testing.md#infrastructure-validation) for prerequisites and limitations. Account-plan eligibility and resource charges must be checked before deployment; this variant does not imply zero-cost hosting.

The existing EC2 templates use physical names and exports without a variant namespace. Resolve naming and regional registry-scanning ownership before deploying both variants in the same account and Region.
