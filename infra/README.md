# AWS infrastructure

CloudFormation templates are grouped by independently deployed stack and lifecycle. Each stack lives in `<stack-name>/template.yaml`; stack-specific parameters and resources stay together. The `network/` and `endpoints/` templates are in progress. AWS deployment state and verification are tracked in [the AWS deployment plan](../docs/aws-deployment-plan.md).

## Stack boundaries

| Stack directory | Owns                                                    |
| --------------- | ------------------------------------------------------- |
| `network/`      | VPC, subnets, internet gateway, route tables            |
| `endpoints/`    | Private ECR, ECS, and Systems Manager endpoints         |
| `compute/`      | ECS cluster and EC2 capacity                            |
| `database/`     | RDS PostgreSQL and DB subnet group                      |
| `ingress/`      | Application Load Balancer, listeners, and target groups |
| `frontend/`     | S3 frontend bucket and CloudFront distribution          |

Create a stack directory when its template is ready; keep the repository free of empty stack placeholders. Deploy stacks separately, in dependency order. The `network/` stack is the foundation; other stacks consume only the network outputs they need. Pass shared resource IDs through CloudFormation exports and `Fn::ImportValue`; imports must be in the same account and Region, and an export cannot be changed or removed while another stack imports it.

Run `npm run infra:check` to format-check and lint the CloudFormation templates for `eu-central-1`.
