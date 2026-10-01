# AWS infrastructure

CloudFormation templates are grouped by independently deployed stack and lifecycle. Each stack lives in `<stack-name>/template.yaml`; stack-specific parameters and resources stay together. AWS architecture, decisions, deployment state, and verification are tracked in [the AWS deployment plan](../docs/aws-deployment-plan.md).

## Stack boundaries

| Stack directory | CloudFormation stack name  | Template                  | Owns                                                                                                          | Depends on               |
| --------------- | -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `network/`      | `fit-track-prod-network`   | `network/template.yaml`   | VPC, six subnets, internet gateway, route tables, public route                                                | None                     |
| `endpoints/`    | `fit-track-prod-endpoints` | `endpoints/template.yaml` | ECR/ECS/SSM/Secrets Manager/CloudWatch Logs interface endpoints, S3 gateway endpoint, endpoint security group | `network/`               |
| `compute/`      | `fit-track-prod-compute`   | `compute/template.yaml`   | ECS cluster, capacity provider, EC2 Auto Scaling group, instance role/profile/security group                  | `network/`, `endpoints/` |
| `ecr/`          | `fit-track-prod-ecr`       | `ecr/template.yaml`       | Backend and migration repositories; BASIC scan-on-push; retain 10 newest images                               | None                     |
| `logs/`         | `fit-track-prod-logs`      | `logs/template.yaml`      | Backend CloudWatch Logs group with 30-day retention                                                           | None                     |
| `service/`      | `fit-track-prod-service`   | `service/template.yaml`   | ECS task execution role and backend runtime secret                                                            | None (current draft)     |

Deploy `network` → `endpoints` → `compute`. The `ecr` and `logs` stacks have no infrastructure dependency; deploy `ecr` before pushing images and both before `service`. The ECR scanning resource configures the whole private registry in `eu-central-1`, so check any existing registry scanning configuration before deploying it. The endpoint stack imports network outputs. The compute stack imports network outputs and the endpoint security group ID, then adds an ingress rule that permits HTTPS only from its ECS instance security group. Its Auto Scaling group waits for that rule before launching instances. The current service draft has no cross-stack imports. Its future task definitions and ECS service will use the compute cluster and capacity provider, ECR repositories, and log group from `logs`; secret injection uses the Secrets Manager endpoint. Deploy the network, endpoints, and compute stacks with the names `fit-track-${Environment}-network`, `fit-track-${Environment}-endpoints`, and `fit-track-${Environment}-compute`. Their imports derive export names from this convention and `Environment`; exports use `${AWS::StackName}-<output-logical-ID>`. Pass shared resource IDs through CloudFormation exports and `Fn::ImportValue`; imports must be in the same account and Region, and an export cannot be changed or deleted while another stack imports it. Delete `service` before `ecr`, `logs`, and `compute`, then delete `endpoints` and `network` in reverse dependency order.

Create a stack directory when its template is ready; keep the repository free of empty stack placeholders. Future database, ingress, and frontend stacks are not present yet; add them here when their templates are created.

Run `npm run infra:check` to format-check and lint the CloudFormation templates for `eu-central-1`.
