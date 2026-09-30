# AWS infrastructure

CloudFormation templates are grouped by independently deployed stack and lifecycle. Each stack lives in `<stack-name>/template.yaml`; stack-specific parameters and resources stay together. AWS architecture, decisions, deployment state, and verification are tracked in [the AWS deployment plan](../docs/aws-deployment-plan.md).

## Stack boundaries

| Stack directory | CloudFormation stack name  | Template                  | Owns                                                                                         | Depends on               |
| --------------- | -------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- | ------------------------ |
| `network/`      | `fit-track-prod-network`   | `network/template.yaml`   | VPC, six subnets, internet gateway, route tables, public route                               | None                     |
| `endpoints/`    | `fit-track-prod-endpoints` | `endpoints/template.yaml` | ECR/ECS/SSM interface endpoints, S3 gateway endpoint, endpoint security group                | `network/`               |
| `compute/`      | `fit-track-prod-compute`   | `compute/template.yaml`   | ECS cluster, capacity provider, EC2 Auto Scaling group, instance role/profile/security group | `network/`, `endpoints/` |

Deploy the current stacks in dependency order: `network` → `endpoints` → `compute`. The endpoint stack imports network outputs. The compute stack imports network outputs and the endpoint security group ID, then adds an ingress rule that permits HTTPS only from its ECS instance security group. Its Auto Scaling group waits for that rule before launching instances. Pass shared resource IDs through CloudFormation exports and `Fn::ImportValue`; imports must be in the same account and Region, and an export cannot be changed or removed while another stack imports it. Delete in reverse dependency order: `compute`, `endpoints`, then `network`.

Create a stack directory when its template is ready; keep the repository free of empty stack placeholders. Future database, ingress, and frontend stacks are not present yet; add them here when their templates are created.

Run `npm run infra:check` to format-check and lint the CloudFormation templates for `eu-central-1`.
