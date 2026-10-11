#!/usr/bin/env bash

set -euo pipefail
# shellcheck source=scripts/deploy/common.sh
source "$(dirname "$0")/common.sh"

# Resolve the existing hosting resources; this does not update the stack.
frontend_stack="$(aws_cli cloudformation describe-stacks --stack-name "$FRONTEND_STACK")"
bucket="$(get_stack_output "$frontend_stack" FrontendBucketName)"
distribution_id="$(get_stack_output "$frontend_stack" CfDistributionId)"

# Upload dependencies before the entry document. Keep older hashed assets.
aws_cli s3 sync frontend/dist/ "s3://$bucket/" \
    --exclude index.html --only-show-errors
aws_cli s3 cp frontend/dist/index.html "s3://$bucket/index.html" \
    --content-type text/html --only-show-errors

# Clear cached paths, including cached errors, and wait for propagation.
invalidation="$(aws_cli cloudfront create-invalidation \
    --distribution-id "$distribution_id" --paths '/*')"
invalidation_id="$(echo "$invalidation" | jq -er '.Invalidation.Id')"
aws_cli cloudfront wait invalidation-completed \
    --distribution-id "$distribution_id" --id "$invalidation_id"

echo "Frontend published to s3://$bucket/"
