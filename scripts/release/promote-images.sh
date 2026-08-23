#!/usr/bin/env bash

set -Eeuo pipefail

if [[ "$#" -lt 3 ]]; then
    echo "Usage: promote-images.sh VERSION REVISION IMAGE [IMAGE ...]" >&2
    exit 1
fi

version="$1"
revision="$2"
shift 2
images=("$@")

if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Version must use the MAJOR.MINOR.PATCH format" >&2
    exit 1
fi

if [[ -z "$revision" ]]; then
    echo "Revision is required" >&2
    exit 1
fi

major="${version%%.*}"
minor_and_patch="${version#*.}"
minor="${minor_and_patch%%.*}"

image_digest() {
    local image_ref="$1"
    local inspection

    inspection="$(docker buildx imagetools inspect "$image_ref")" || return 1
    awk '/^Digest:/ {print $2; exit}' <<<"$inspection"
}

source_digests=()

for image in "${images[@]}"; do
    source_ref="$image:sha-$revision"
    release_ref="$image:$version"
    source_digest="$(image_digest "$source_ref")"

    if [[ -z "$source_digest" ]]; then
        echo "Source image does not expose a digest: $source_ref" >&2
        exit 1
    fi

    if release_digest="$(image_digest "$release_ref" 2>/dev/null)" && \
        [[ "$release_digest" != "$source_digest" ]]; then
        echo "Release tag already points to a different image: $release_ref" >&2
        exit 1
    fi

    source_digests+=("$source_digest")
done

for index in "${!images[@]}"; do
    image="${images[$index]}"
    source_digest="${source_digests[$index]}"
    release_ref="$image:$version"

    docker buildx imagetools create \
        --tag "$release_ref" \
        --tag "$image:$major.$minor" \
        --tag "$image:$major" \
        --tag "$image:latest" \
        "$image@$source_digest"

    published_digest="$(image_digest "$release_ref")"
    if [[ "$published_digest" != "$source_digest" ]]; then
        echo "Published release digest does not match its source: $release_ref" >&2
        exit 1
    fi

    echo "Promoted $image@$source_digest to $version, $major.$minor, $major, and latest"
done
