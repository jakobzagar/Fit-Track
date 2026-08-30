#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

mkdir -p \
    "$temporary_directory/.github/release-please" \
    "$temporary_directory/backend" \
    "$temporary_directory/frontend" \
    "$temporary_directory/shared"

cp "$repository_root/package.json" "$temporary_directory/package.json"
cp "$repository_root/package-lock.json" "$temporary_directory/package-lock.json"
cp "$repository_root/CHANGELOG.md" "$temporary_directory/CHANGELOG.md"
cp "$repository_root/.github/release-please/manifest.json" \
    "$temporary_directory/.github/release-please/manifest.json"
cp "$repository_root/backend/package.json" "$temporary_directory/backend/package.json"
cp "$repository_root/frontend/package.json" "$temporary_directory/frontend/package.json"
cp "$repository_root/shared/package.json" "$temporary_directory/shared/package.json"

source "$repository_root/scripts/release/validate.sh"
current_version="$(node -p 'require(process.argv[1]).version' "$repository_root/package.json")"

(
    cd "$temporary_directory"
    validate_release_artifacts "$current_version"
)

sed -i.bak "s/\"version\": \"$current_version\"/\"version\": \"9.9.9\"/" \
    "$temporary_directory/backend/package.json"

if (
    cd "$temporary_directory"
    validate_release_artifacts "$current_version"
) 2>"$temporary_directory/error.log"; then
    echo "Expected mismatched workspace version to fail validation" >&2
    exit 1
fi

grep --fixed-strings --quiet \
    "backend/package.json is \"9.9.9\", expected $current_version" \
    "$temporary_directory/error.log"
