#!/usr/bin/env bash

set -euo pipefail

# Stack names can be overridden when running these scripts locally.
SERVICE_STACK="${SERVICE_STACK:-fit-track-prod-service}"
COMPUTE_STACK="${COMPUTE_STACK:-fit-track-prod-compute}"

fail() {
    echo "$1" >&2
    exit 1
}

# Keep CLI output consistent and disable interactive prompts in CI.
aws_cli() {
    aws "$@" --region "$AWS_REGION" --output json --no-cli-auto-prompt --no-cli-pager
}

read_stack() {
    aws_cli cloudformation describe-stacks --stack-name "$1"
}

# Extract one named output from a describe-stacks JSON response.
get_stack_output() {
    local stack_json="$1"
    local output_name="$2"

    echo "$stack_json" | jq -er --arg name "$output_name" '
        .Stacks[0].Outputs[]
        | select(.OutputKey == $name)
        | .OutputValue
    '
}

# Extract one existing CloudFormation parameter without logging its value.
get_stack_parameter() {
    local stack_json="$1"
    local parameter_name="$2"

    echo "$stack_json" | jq -er --arg name "$parameter_name" '
        .Stacks[0].Parameters[]
        | select(.ParameterKey == $name)
        | .ParameterValue
    '
}
