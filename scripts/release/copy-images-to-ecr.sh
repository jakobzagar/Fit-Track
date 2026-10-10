#!/usr/bin/env bash

set -euo pipefail

owner="$(echo "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')"

for component in backend migration; do
    repository="fit-track-prod-$component-$AWS_REGION"
    digest="$BACKEND_DIGEST"
    if [[ "$component" == "migration" ]]; then
        digest="$MIGRATION_DIGEST"
    fi
    destination="$ECR_REGISTRY/$repository:$VERSION"
    source="$REGISTRY/$owner/fit-track-$component@$digest"
    # List tags so a missing release is not confused with an AWS API error.
    images="$(aws ecr describe-images --repository-name "$repository" \
        --output json --no-cli-auto-prompt --no-cli-pager)"
    existing="$(echo "$images" | jq -r --arg tag "$VERSION" '
        [.imageDetails[] | select((.imageTags // []) | index($tag))]
        | first | .imageDigest // "None"
    ')"
    if [[ "$existing" == "None" ]]; then
        docker buildx imagetools create --tag "$destination" "$source"
    elif [[ "$existing" != "$digest" ]]; then
        echo "ECR release tag already points to different content: $destination" >&2
        exit 1
    fi
    actual="$(aws ecr describe-images --repository-name "$repository" \
        --image-ids "imageTag=$VERSION" --query 'imageDetails[0].imageDigest' \
        --output text --no-cli-auto-prompt --no-cli-pager)"
    if [[ "$actual" != "$digest" ]]; then
        echo "ECR digest mismatch: $destination" >&2
        exit 1
    fi
    reference="$ECR_REGISTRY/$repository@$actual"
    echo "$component-ref=$reference" >> "$GITHUB_OUTPUT"
    echo "- $component: \`$reference\`" >> "$GITHUB_STEP_SUMMARY"
done
