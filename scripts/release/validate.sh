#!/usr/bin/env bash

set -Eeuo pipefail

release_tag="${1:-}"
release_root="${RELEASE_ROOT:-$PWD}"

if [[ ! "$release_tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Release tag must use the vMAJOR.MINOR.PATCH format" >&2
    exit 1
fi

version="${release_tag#v}"

node - "$release_root" "$version" <<'NODE'
const {readFileSync} = require("node:fs");
const {join} = require("node:path");

const [root, expectedVersion] = process.argv.slice(2);
const failures = [];
const readJson = (relativePath) =>
    JSON.parse(readFileSync(join(root, relativePath), "utf8"));

const checkVersion = (label, actualVersion) => {
    if (actualVersion !== expectedVersion) {
        failures.push(
            `${label} is ${JSON.stringify(actualVersion)}, expected ${JSON.stringify(expectedVersion)}`,
        );
    }
};

for (const path of [
    "package.json",
    "backend/package.json",
    "frontend/package.json",
    "shared/package.json",
]) {
    checkVersion(path, readJson(path).version);
}

const lockfile = readJson("package-lock.json");
checkVersion("package-lock.json root version", lockfile.version);
for (const workspace of ["", "backend", "frontend", "shared"]) {
    checkVersion(
        `package-lock.json packages[${JSON.stringify(workspace)}]`,
        lockfile.packages?.[workspace]?.version,
    );
}

const manifest = readJson(".github/release-please/manifest.json");
checkVersion(".github/release-please/manifest.json entry for .", manifest["."]);

if (failures.length > 0) {
    console.error(`Release artifacts do not match version ${expectedVersion}:`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
}
NODE

printf 'version=%s\n' "$version"
