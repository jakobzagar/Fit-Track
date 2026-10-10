#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -lt 2 ]]; then
    echo "Usage: promote-images.sh VERSION IMAGE@DIGEST [IMAGE@DIGEST ...]" >&2
    exit 1
fi

version="$1"
shift

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must use the MAJOR.MINOR.PATCH format" >&2
    exit 1
fi

resolve_digest() {
    docker buildx imagetools inspect "$1" | awk '/^Digest:/ {print $2; exit}'
}

for source_ref in "$@"; do
    if [[ ! "$source_ref" =~ ^([^[:space:]@]+)@(sha256:[0-9a-f]{64})$ ]]; then
        echo "Image must use an exact sha256 digest: $source_ref" >&2
        exit 1
    fi

    image="${source_ref%@*}"
    source_digest="${source_ref#*@}"
    release_ref="$image:$version"

    if release_digest="$(resolve_digest "$release_ref" 2>/dev/null)" && \
        [[ "$release_digest" != "$source_digest" ]]; then
        echo "Release tag already points to a different image: $release_ref" >&2
        exit 1
    fi
done

for source_ref in "$@"; do
    image="${source_ref%@*}"
    source_digest="${source_ref#*@}"
    release_ref="$image:$version"

    docker buildx imagetools create \
        --tag "$release_ref" \
        --tag "$image:latest" \
        "$source_ref"

    if [[ "$(resolve_digest "$release_ref")" != "$source_digest" ]]; then
        echo "Published release digest does not match its source: $release_ref" >&2
        exit 1
    fi
done
