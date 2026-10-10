#!/usr/bin/env bash

set -euo pipefail
# shellcheck source=scripts/deploy/common.sh
source "$(dirname "$0")/common.sh"

# Resolve the migration revision and cluster from CloudFormation.
service_stack="$(read_stack "$SERVICE_STACK")"
current_digest="$(get_stack_parameter "$service_stack" MigrationImageDigest)"
if [ "$current_digest" != "$MIGRATION_DIGEST" ]; then
    fail "Migration stack digest does not match this release"
fi

task_definition_arn="$(get_stack_output "$service_stack" MigrationTaskDefinitionArn)"
service_arn="$(get_stack_output "$service_stack" BackendServiceArn)"
compute_stack="$(read_stack "$COMPUTE_STACK")"
cluster_arn="$(get_stack_output "$compute_stack" EcsClusterArn)"

# Reuse the backend service's subnets and security groups, without a public IP.
service_json="$(aws_cli ecs describe-services --cluster "$cluster_arn" --services "$service_arn")"
network_configuration="$(echo "$service_json" | jq -e '
    .services[0].networkConfiguration
    | .awsvpcConfiguration.assignPublicIp = "DISABLED"
')"

# Start one migration task and wait until it stops.
launch_result="$(aws_cli ecs run-task \
    --cluster "$cluster_arn" \
    --task-definition "$task_definition_arn" \
    --capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
    --count 1 \
    --network-configuration "$network_configuration")"

if [ "$(echo "$launch_result" | jq '.failures | length')" -gt 0 ]; then
    fail "ECS could not start the migration task"
fi

task_arn="$(echo "$launch_result" | jq -er '.tasks[0].taskArn')"
echo "Waiting for migration task: $task_arn"
aws_cli ecs wait tasks-stopped --cluster "$cluster_arn" --tasks "$task_arn"

# A stopped task succeeds only when the migration container exits with 0.
task_result="$(aws_cli ecs describe-tasks --cluster "$cluster_arn" --tasks "$task_arn")"
exit_code="$(echo "$task_result" | jq -r '
    .tasks[0].containers[] | select(.name == "migration") | .exitCode
')"
if [ "$exit_code" != "0" ]; then
    fail "Migration failed; inspect task $task_arn and its CloudWatch logs"
fi

echo "Migration completed successfully"
