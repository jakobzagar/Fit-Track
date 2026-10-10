#!/usr/bin/env bash

set -euo pipefail
# shellcheck source=scripts/deploy/common.sh
source "$(dirname "$0")/common.sh"

# Resolve the backend revision that CloudFormation should have deployed.
service_stack="$(read_stack "$SERVICE_STACK")"
current_digest="$(get_stack_parameter "$service_stack" BackendImageDigest)"
if [ "$current_digest" != "$BACKEND_DIGEST" ]; then
    fail "Backend stack digest does not match this release"
fi

expected_task_definition="$(get_stack_output "$service_stack" BackendTaskDefinitionArn)"
service_arn="$(get_stack_output "$service_stack" BackendServiceArn)"
compute_stack="$(read_stack "$COMPUTE_STACK")"
cluster_arn="$(get_stack_output "$compute_stack" EcsClusterArn)"

# AWS waits for a single deployment with the desired number of running tasks.
aws_cli ecs wait services-stable --cluster "$cluster_arn" --services "$service_arn"
service_result="$(aws_cli ecs describe-services --cluster "$cluster_arn" --services "$service_arn")"

# Stability alone can also mean ECS rolled back to the old revision.
actual_task_definition="$(echo "$service_result" | jq -er '.services[0].taskDefinition')"
if [ "$actual_task_definition" != "$expected_task_definition" ]; then
    fail "Backend rolled back or is running a different task definition"
fi

desired_count="$(echo "$service_result" | jq -er '.services[0].desiredCount')"
rollout_state="$(echo "$service_result" | jq -er '.services[0].deployments[0].rolloutState')"
if [ "$desired_count" -lt 1 ] || [ "$rollout_state" != "COMPLETED" ]; then
    fail "Backend deployment has not completed with running tasks"
fi

echo "Backend deployment verified: $expected_task_definition"
