# Fargate / Single-AZ infrastructure

This directory holds the deployment variant using ECS Fargate in one private application subnet and a private Single-AZ RDS PostgreSQL instance. CloudFormation templates will be added as each stack is implemented; none are present yet. Architecture decisions, implementation state, and verification belong in the [AWS deployment plan](../../docs/aws-deployment-plan.md).

The [EC2 / Multi-AZ variant](../ec2-multi-az/README.md) contains the existing templates. The two directories represent alternative architectures, not staging and production environments. Single-AZ describes application task placement and the database instance; the ALB and RDS subnet group still require subnets in two Availability Zones.

## Planned stack boundaries

| Stack       | Responsibility                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `network`   | VPC, two public ALB subnets, one private application subnet, two private database subnets, internet gateway, and route tables; no NAT gateway. |
| `endpoints` | ECR API, ECR DKR, CloudWatch Logs, and Secrets Manager interface endpoints in the application AZ; S3 gateway endpoint for image layers.        |
| `compute`   | ECS cluster using Fargate; no EC2 instances, launch template, Auto Scaling group, or EC2 capacity provider.                                    |
| `ecr`       | Backend and migration image repositories and image lifecycle settings.                                                                         |
| `logs`      | Backend and migration CloudWatch Logs groups.                                                                                                  |
| `ingress`   | ALB, HTTP listener, backend IP target group, and CloudFront-facing security group.                                                             |
| `service`   | One backend Fargate task, one-off migration task definition, execution roles, runtime secrets, and task security group.                        |
| `database`  | Private Single-AZ PostgreSQL instance, TLS parameter group, two-AZ subnet group, and task-restricted security group.                           |
| `frontend`  | Private S3 bucket, CloudFront OAC and distribution, API routing, SPA navigation, cache policies, and response headers.                         |

## Deployment and validation

Deployment dependencies and exact resource names will be documented alongside the implemented templates. Database users and grants must be prepared before migrations and backend startup; runtime secret values stay outside CloudFormation and the repository.

Run `npm run infra:check` after adding or changing templates. See [infrastructure validation](../../docs/testing.md#infrastructure-validation) for prerequisites and limitations. Account-plan eligibility and resource charges must be checked before deployment; this variant does not imply zero-cost hosting.

The existing EC2 templates use physical names and exports without a variant namespace. Resolve naming and regional registry-scanning ownership before deploying both variants in the same account and Region.
