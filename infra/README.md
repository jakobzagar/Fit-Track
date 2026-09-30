# AWS infrastructure

CloudFormation templates are grouped by independently deployed stack and lifecycle. Each stack lives in `<stack-name>/template.yaml`; stack-specific parameters and resources stay together. AWS architecture, decisions, deployment state, and verification are tracked in [the AWS deployment plan](../docs/aws-deployment-plan.md).

## Stack boundaries

| Stack directory | CloudFormation stack name  | Template                  | Owns                                                                                          | Depends on               |
| --------------- | -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------- | ------------------------ |
| `network/`      | `fit-track-prod-network`   | `network/template.yaml`   | VPC, six subnets, internet gateway, route tables, public route                                | None                     |
| `endpoints/`    | `fit-track-prod-endpoints` | `endpoints/template.yaml` | ECR/ECS/SSM/CloudWatch Logs interface endpoints, S3 gateway endpoint, endpoint security group | `network/`               |
| `compute/`      | `fit-track-prod-compute`   | `compute/template.yaml`   | ECS cluster, capacity provider, EC2 Auto Scaling group, instance role/profile/security group  | `network/`, `endpoints/` |
| `logs/`         | `fit-track-prod-logs`      | `logs/template.yaml`      | Backend CloudWatch Logs group with 30-day retention                                           | None                     |

Deploy `network` → `endpoints` → `compute`. The `logs` stack has no infrastructure dependency and must exist before the future ECS service stack. The endpoint stack imports network outputs. The compute stack imports network outputs and the endpoint security group ID, then adds an ingress rule that permits HTTPS only from its ECS instance security group. Its Auto Scaling group waits for that rule before launching instances. The future service stack will import the compute cluster and capacity provider, plus the log group name and ARN from `logs`. Pass shared resource IDs through CloudFormation exports and `Fn::ImportValue`; imports must be in the same account and Region, and an export cannot be changed or deleted while another stack imports it. Delete the future service stack before `logs` and `compute`, then delete `endpoints` and `network` in reverse dependency order.

Create a stack directory when its template is ready; keep the repository free of empty stack placeholders. Future database, ingress, and frontend stacks are not present yet; add them here when their templates are created.

Run `npm run infra:check` to format-check and lint the CloudFormation templates for `eu-central-1`.
