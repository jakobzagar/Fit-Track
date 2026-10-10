#!/usr/bin/env bash

set -Eeuo pipefail

: "${AWS_REGION:?AWS_REGION is required}"
: "${ECR_REGISTRY:?ECR_REGISTRY is required}"
: "${VERSION:?VERSION is required}"
: "${BACKEND_DIGEST:?BACKEND_DIGEST is required}"
: "${MIGRATION_DIGEST:?MIGRATION_DIGEST is required}"
: "${REGISTRY:?REGISTRY is required}"
: "${GITHUB_REPOSITORY_OWNER:?GITHUB_REPOSITORY_OWNER is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"
: "${GITHUB_STEP_SUMMARY:?GITHUB_STEP_SUMMARY is required}"

for component in backend migration; do
    repository="fit-track-prod-$component-$AWS_REGION"
    digest="$BACKEND_DIGEST"
    if [[ "$component" == "migration" ]]; then
        digest="$MIGRATION_DIGEST"
    fi
    destination="$ECR_REGISTRY/$repository:$VERSION"
    source="$REGISTRY/$(printf %s "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')/fit-track-$component@$digest"
    existing="$(aws ecr describe-images --repository-name "$repository" \
        --query "imageDetails[?contains(imageTags || \`[]\`, \`\"$VERSION\"\`)].imageDigest | [0]" \
        --output text --no-cli-auto-prompt --no-cli-pager)"
    if [[ "$existing" == "None" ]]; then
        docker buildx imagetools create --tag "$destination" "$source"
    elif [[ "$existing" != "$digest" ]]; then
        echo "ECR release tag already points to different content: $destination" >&2
        exit 1
    fi
    actual="$(aws ecr describe-images --repository-name "$repository" \
        --image-ids "imageTag=$VERSION" --query 'imageDetails[0].imageDigest' \
        --output text --no-cli-auto-prompt --no-cli-pager)"
    [[ "$actual" == "$digest" ]] || { echo "ECR digest mismatch: $destination" >&2; exit 1; }
    reference="$ECR_REGISTRY/$repository@$actual"
    echo "$component-ref=$reference" >> "$GITHUB_OUTPUT"
    echo "- $component: \`$reference\`" >> "$GITHUB_STEP_SUMMARY"
done
