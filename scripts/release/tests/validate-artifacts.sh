#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

mkdir -p \
    "$temporary_directory/.github/release-please" \
    "$temporary_directory/backend" \
    "$temporary_directory/backend/migration-runtime" \
    "$temporary_directory/frontend" \
    "$temporary_directory/shared"

cp "$repository_root/package.json" "$temporary_directory/package.json"
cp "$repository_root/package-lock.json" "$temporary_directory/package-lock.json"
cp "$repository_root/CHANGELOG.md" "$temporary_directory/CHANGELOG.md"
cp "$repository_root/.github/release-please/manifest.json" \
    "$temporary_directory/.github/release-please/manifest.json"
cp "$repository_root/backend/package.json" "$temporary_directory/backend/package.json"
cp "$repository_root/backend/migration-runtime/package.json" \
    "$temporary_directory/backend/migration-runtime/package.json"
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

cp "$repository_root/backend/package.json" "$temporary_directory/backend/package.json"

for dependency in prisma dotenv; do
    cp "$repository_root/backend/migration-runtime/package.json" \
        "$temporary_directory/backend/migration-runtime/package.json"

    node - "$temporary_directory/backend/migration-runtime/package.json" "$dependency" <<'NODE'
const {readFileSync, writeFileSync} = require("node:fs");

const [path, dependency] = process.argv.slice(2);
const packageJson = JSON.parse(readFileSync(path, "utf8"));
packageJson.dependencies[dependency] = "9.9.9";
writeFileSync(path, `${JSON.stringify(packageJson, null, 4)}\n`);
NODE

    if (
        cd "$temporary_directory"
        validate_release_artifacts "$current_version"
    ) 2>"$temporary_directory/migration-error.log"; then
        echo "Expected mismatched migration dependency to fail validation: $dependency" >&2
        exit 1
    fi

    expected_range="$(node - "$repository_root/backend/package.json" "$dependency" <<'NODE'
const packageJson = require(process.argv[2]);
const dependency = process.argv[3];
console.log(packageJson.dependencies[dependency] ?? packageJson.devDependencies[dependency]);
NODE
)"
    grep --fixed-strings --quiet \
        "backend/migration-runtime/package.json dependency $dependency is \"9.9.9\", expected \"$expected_range\"" \
        "$temporary_directory/migration-error.log"
done
