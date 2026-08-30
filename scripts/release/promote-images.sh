#!/usr/bin/env bash

set -Eeuo pipefail

if [[ "$#" -lt 2 ]]; then
    echo "Usage: promote-images.sh VERSION IMAGE@DIGEST [IMAGE@DIGEST ...]" >&2
    exit 1
fi

version="$1"
shift
source_refs=("$@")

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must use the MAJOR.MINOR.PATCH format" >&2
    exit 1
fi

resolve_image_digest() {
    docker buildx imagetools inspect "$1" | awk '/^Digest:/ {print $2; exit}'
}

for source_ref in "${source_refs[@]}"; do
    if [[ ! "$source_ref" =~ ^(.+)@(sha256:[0-9a-f]{64})$ ]]; then
        echo "Image must use an exact sha256 digest: $source_ref" >&2
        exit 1
    fi

    image="${BASH_REMATCH[1]}"
    source_digest="${BASH_REMATCH[2]}"
    release_ref="$image:$version"

    if release_digest="$(resolve_image_digest "$release_ref" 2>/dev/null)" && \
        [[ "$release_digest" != "$source_digest" ]]; then
        echo "Release tag already points to a different image: $release_ref" >&2
        exit 1
    fi
done

for source_ref in "${source_refs[@]}"; do
    [[ "$source_ref" =~ ^(.+)@(sha256:[0-9a-f]{64})$ ]]
    image="${BASH_REMATCH[1]}"
    source_digest="${BASH_REMATCH[2]}"
    release_ref="$image:$version"

    docker buildx imagetools create \
        --tag "$release_ref" \
        --tag "$image:latest" \
        "$source_ref"

    if [[ "$(resolve_image_digest "$release_ref")" != "$source_digest" ]]; then
        echo "Published release digest does not match its source: $release_ref" >&2
        exit 1
    fi

    echo "Promoted $source_ref to $version and latest"
done
