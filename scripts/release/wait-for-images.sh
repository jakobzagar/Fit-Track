#!/usr/bin/env bash

set -euo pipefail

# Release tags and the main publication can start concurrently.
for attempt in {1..90}; do
    runs="$(gh api "repos/$GITHUB_REPOSITORY/actions/workflows/build-push.yaml/runs?head_sha=$GITHUB_SHA&branch=main&per_page=100")"
    state="$(echo "$runs" | jq -r '
        [.workflow_runs[] | select(.head_sha == env.GITHUB_SHA)] | first
        | if . == null or .status != "completed" then "pending"
          else .conclusion end
    ')"
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

owner="$(echo "$GITHUB_REPOSITORY_OWNER" | tr '[:upper:]' '[:lower:]')"

for component in backend frontend migration; do
    image="$REGISTRY/$owner/fit-track-$component"
    digest="$(docker buildx imagetools inspect "$image:sha-$GITHUB_SHA" | awk '/^Digest:/ {print $2; exit}')"
    if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
        echo "Could not resolve image digest: $image" >&2
        exit 1
    fi
    echo "$component-digest=$digest" >> "$GITHUB_OUTPUT"
done
