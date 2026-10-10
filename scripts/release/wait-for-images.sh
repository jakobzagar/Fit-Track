#!/usr/bin/env bash

set -Eeuo pipefail

: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${GITHUB_REPOSITORY_OWNER:?GITHUB_REPOSITORY_OWNER is required}"
: "${REGISTRY:?REGISTRY is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

# Release tags and the main publication can start concurrently.
for attempt in {1..90}; do
    runs="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/build-push.yaml/runs?head_sha=$GITHUB_SHA&branch=main&per_page=100")"
    state="$(jq -r '[.workflow_runs[] | select(.head_sha == env.GITHUB_SHA)] | first | if . == null then "pending" elif .status != "completed" then "pending" else .conclusion end' <<< "$runs")"
    if [[ "$state" == "success" ]]; then
        break
    fi
    if [[ "$state" != "pending" ]]; then
        echo "Main image publication did not succeed for $GITHUB_SHA: $state" >&2
        exit 1
    fi
    if [[ "$attempt" == "90" ]]; then
        echo "Timed out waiting for main image publication for $GITHUB_SHA" >&2
        exit 1
    fi
    sleep 20
done

for component in backend frontend migration; do
    image="$REGISTRY/$(printf %s "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')/fit-track-$component"
    digest="$(docker buildx imagetools inspect "$image:sha-$GITHUB_SHA" | awk '/^Digest:/ {print $2; exit}')"
    [[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || exit 1
    echo "$component-digest=$digest" >> "$GITHUB_OUTPUT"
done
