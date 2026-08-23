#!/usr/bin/env bash

set -Eeuo pipefail

release_tag="${1:-}"
main_ref="${2:-origin/main}"
revision_ref="${3:-HEAD}"

if [[ ! "$release_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Release tag must use the vMAJOR.MINOR.PATCH format" >&2
    exit 1
fi

if ! revision="$(git rev-parse --verify "${revision_ref}^{commit}")"; then
    echo "Release revision does not resolve to a commit: $revision_ref" >&2
    exit 1
fi

if ! main_revision="$(git rev-parse --verify "${main_ref}^{commit}")"; then
    echo "Main reference does not resolve to a commit: $main_ref" >&2
    exit 1
fi

if ! tag_revision="$(git rev-parse --verify "${release_tag}^{commit}")"; then
    echo "Release tag does not resolve to a commit: $release_tag" >&2
    exit 1
fi

if [[ "$tag_revision" != "$revision" ]]; then
    echo "Release tag must point to the checked-out revision" >&2
    exit 1
fi

if ! git merge-base --is-ancestor "$revision" "$main_revision"; then
    echo "Release commit must belong to the main branch" >&2
    exit 1
fi

latest_tag=""
while IFS= read -r candidate; do
    if [[ "$candidate" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] && \
        git merge-base --is-ancestor "${candidate}^{commit}" "$main_revision"; then
        latest_tag="$candidate"
        break
    fi
done < <(git tag --list "v*.*.*" --sort=-version:refname)

if [[ "$latest_tag" != "$release_tag" ]]; then
    echo "Release tag must be the highest SemVer tag on main (latest: ${latest_tag:-none})" >&2
    exit 1
fi

version="${release_tag#v}"
major="${version%%.*}"
minor_and_patch="${version#*.}"
minor="${minor_and_patch%%.*}"

printf 'version=%s\n' "$version"
printf 'major=%s\n' "$major"
printf 'minor=%s\n' "$minor"
printf 'revision=%s\n' "$revision"
