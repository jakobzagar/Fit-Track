#!/usr/bin/env bash

set -euo pipefail
# shellcheck source=scripts/deploy/common.sh
source "$(dirname "$0")/common.sh"

# Choose which image parameter to update.
if [ "$#" -ne 1 ]; then
    fail "Usage: update-service-stack.sh migration|backend"
fi
component="$1"
if [ "$component" = "migration" ]; then
    parameter_name="MigrationImageDigest"
    image_digest="$MIGRATION_DIGEST"
elif [ "$component" = "backend" ]; then
    parameter_name="BackendImageDigest"
    image_digest="$BACKEND_DIGEST"
else
    fail "Usage: update-service-stack.sh migration|backend"
fi

# AWS rejects updates when the stack is not ready.
service_stack="$(read_stack "$SERVICE_STACK")"

# Preserve capacity. An old bootstrap value must not turn the API off.
desired_count="$(get_stack_parameter "$service_stack" BackendDesiredCount)"
if [ "$desired_count" -lt 1 ]; then
    fail "Set BackendDesiredCount to a positive value in CloudFormation before CD"
fi

compute_stack="$(read_stack "$COMPUTE_STACK")"
cluster_arn="$(get_stack_output "$compute_stack" EcsClusterArn)"
service_arn="$(get_stack_output "$service_stack" BackendServiceArn)"
service_json="$(aws_cli ecs describe-services --cluster "$cluster_arn" --services "$service_arn")"
live_desired_count="$(echo "$service_json" | jq -er '.services[0].desiredCount')"
if [ "$live_desired_count" != "$desired_count" ]; then
    fail "Reconcile live service capacity with CloudFormation before CD"
fi

# A retry does not need another stack update if this digest is already set.
current_digest="$(get_stack_parameter "$service_stack" "$parameter_name")"
if [ "$current_digest" = "$image_digest" ]; then
    echo "No $component changes required"
    exit 0
fi

# Change one parameter; retain every other parameter's existing value.
parameters="$(echo "$service_stack" | jq --arg name "$parameter_name" --arg digest "$image_digest" '
    [.Stacks[0].Parameters[] |
        if .ParameterKey == $name then
            {ParameterKey: .ParameterKey, ParameterValue: $digest}
        else
            {ParameterKey: .ParameterKey, UsePreviousValue: true}
        end
    ]
')"
change_set_name="fit-track-$component-$(date +%s)"

# Reuse the deployed template. This release does not upload template changes.
echo "Preparing $component change set: $change_set_name"
aws_cli cloudformation create-change-set \
    --stack-name "$SERVICE_STACK" \
    --change-set-name "$change_set_name" \
    --change-set-type UPDATE \
    --use-previous-template \
    --parameters "$parameters" \
    --capabilities CAPABILITY_NAMED_IAM \
    --role-arn "$CFN_SERVICE_ROLE_ARN"

aws_cli cloudformation wait change-set-create-complete \
    --stack-name "$SERVICE_STACK" \
    --change-set-name "$change_set_name"

# Print a short resource summary, then execute the prepared change set.
aws_cli cloudformation describe-change-set \
    --stack-name "$SERVICE_STACK" \
    --change-set-name "$change_set_name" \
    | jq '[.Changes[].ResourceChange | {LogicalResourceId, Action, Replacement}]'

aws_cli cloudformation execute-change-set \
    --stack-name "$SERVICE_STACK" \
    --change-set-name "$change_set_name"

aws_cli cloudformation wait stack-update-complete --stack-name "$SERVICE_STACK"
echo "$component stack update completed"
