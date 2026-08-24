#!/usr/bin/env bash

set -Eeuo pipefail

validate_release_artifacts() {
    local expected_version="$1"

    node - "$expected_version" <<'NODE'
const {readFileSync} = require("node:fs");

const expectedVersion = process.argv[2];
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const failures = [];

const checkVersion = (label, actualVersion) => {
    if (actualVersion !== expectedVersion) {
        failures.push(`${label} is ${JSON.stringify(actualVersion)}, expected ${expectedVersion}`);
    }
};

for (const path of ["package.json", "shared/package.json", "backend/package.json", "frontend/package.json"]) {
    checkVersion(path, readJson(path).version);
}

const lockfile = readJson("package-lock.json");
checkVersion("package-lock.json root version", lockfile.version);
for (const workspace of ["", "shared", "backend", "frontend"]) {
    checkVersion(`package-lock.json packages[${JSON.stringify(workspace)}]`, lockfile.packages?.[workspace]?.version);
}

checkVersion(
    ".github/release-please/manifest.json entry for .",
    readJson(".github/release-please/manifest.json")["."],
);

const escapedVersion = expectedVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const changelogHeading = new RegExp(`^## \\[${escapedVersion}\\](?:\\(|\\s|$)`, "m");
if (!changelogHeading.test(readFileSync("CHANGELOG.md", "utf8"))) {
    failures.push(`CHANGELOG.md has no ${expectedVersion} release heading`);
}

if (failures.length > 0) {
    console.error(`Release artifacts do not match version ${expectedVersion}:`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}
NODE
}

main() {
    local release_tag="${1:-}"
    local main_ref="${2:-origin/main}"
    local revision_ref="${3:-HEAD}"

    if [[ ! "$release_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Release tag must use the vMAJOR.MINOR.PATCH format" >&2
        exit 1
    fi

    local revision
    if ! revision="$(git rev-parse --verify "${revision_ref}^{commit}")"; then
        echo "Release revision does not resolve to a commit: $revision_ref" >&2
        exit 1
    fi

    local main_revision
    if ! main_revision="$(git rev-parse --verify "${main_ref}^{commit}")"; then
        echo "Main reference does not resolve to a commit: $main_ref" >&2
        exit 1
    fi

    local tag_revision
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

    local latest_tag=""
    local candidate
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

    local version="${release_tag#v}"
    validate_release_artifacts "$version"

    printf 'version=%s\n' "$version"
    printf 'revision=%s\n' "$revision"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    main "$@"
fi
