#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
temporary_directory="$(mktemp -d)"
trap 'rm -rf "$temporary_directory"' EXIT

fail() {
    echo "$1" >&2
    exit 1
}

expect_failure() {
    local expected_message="$1"
    shift

    if "$@" >"$temporary_directory/output.log" 2>&1; then
        fail "Expected command to fail: $*"
    fi

    grep -Fq "$expected_message" "$temporary_directory/output.log" || {
        cat "$temporary_directory/output.log" >&2
        fail "Expected failure message: $expected_message"
    }
}

create_release_fixture() {
    local directory="$1"
    mkdir -p "$directory/.github/release-please" "$directory/backend" "$directory/frontend" "$directory/shared"

    for package_path in package.json backend/package.json frontend/package.json shared/package.json; do
        printf '{"name":"fixture","version":"1.2.3"}\n' >"$directory/$package_path"
    done

    printf '%s\n' \
        '{"name":"fixture","version":"1.2.3","lockfileVersion":3,"packages":{"":{"version":"1.2.3"},"backend":{"version":"1.2.3"},"frontend":{"version":"1.2.3"},"shared":{"version":"1.2.3"}}}' \
        >"$directory/package-lock.json"
    printf '{".":"1.2.3"}\n' >"$directory/.github/release-please/manifest.json"
}

valid_fixture="$temporary_directory/valid"
create_release_fixture "$valid_fixture"
(
    cd "$valid_fixture"
    bash "$repository_root/scripts/release/validate.sh" v1.2.3 >/dev/null
)

expect_failure \
    "Release tag must use the vMAJOR.MINOR.PATCH format" \
    bash "$repository_root/scripts/release/validate.sh" 1.2.3

workspace_fixture="$temporary_directory/workspace-mismatch"
create_release_fixture "$workspace_fixture"
printf '{"name":"fixture","version":"9.9.9"}\n' >"$workspace_fixture/backend/package.json"
expect_failure \
    'backend/package.json is "9.9.9", expected "1.2.3"' \
    env RELEASE_ROOT="$workspace_fixture" bash "$repository_root/scripts/release/validate.sh" v1.2.3

manifest_fixture="$temporary_directory/manifest-mismatch"
create_release_fixture "$manifest_fixture"
printf '{".":"9.9.9"}\n' >"$manifest_fixture/.github/release-please/manifest.json"
expect_failure \
    '.github/release-please/manifest.json entry for . is "9.9.9", expected "1.2.3"' \
    env RELEASE_ROOT="$manifest_fixture" bash "$repository_root/scripts/release/validate.sh" v1.2.3

lockfile_fixture="$temporary_directory/lockfile-mismatch"
create_release_fixture "$lockfile_fixture"
node - "$lockfile_fixture/package-lock.json" <<'NODE'
const {readFileSync, writeFileSync} = require("node:fs");
const path = process.argv[2];
const lockfile = JSON.parse(readFileSync(path, "utf8"));
lockfile.packages.backend.version = "9.9.9";
writeFileSync(path, JSON.stringify(lockfile));
NODE
expect_failure \
    'package-lock.json packages["backend"] is "9.9.9", expected "1.2.3"' \
    env RELEASE_ROOT="$lockfile_fixture" bash "$repository_root/scripts/release/validate.sh" v1.2.3

fake_bin="$temporary_directory/bin"
mkdir -p "$fake_bin"
cat >"$fake_bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$1 $2 $3" == "buildx imagetools inspect" ]]; then
    if [[ "${FAKE_CONFLICT_REF:-}" == "$4" ]]; then
        printf 'Digest: sha256:%064d\n' 0
        exit 0
    fi

    grep -Fq "$4" "$FAKE_DOCKER_STATE" || exit 1
    printf 'Digest: %s\n' "$FAKE_DIGEST"
    exit 0
fi

if [[ "$1 $2 $3" == "buildx imagetools create" ]]; then
    shift 3
    while [[ "$#" -gt 1 ]]; do
        if [[ "$1" == "--tag" ]]; then
            printf '%s\n' "$2" >>"$FAKE_DOCKER_STATE"
            shift 2
        else
            shift
        fi
    done
    exit 0
fi

exit 1
DOCKER
chmod +x "$fake_bin/docker"

digest="sha256:$(printf 'a%.0s' {1..64})"
state_file="$temporary_directory/docker-state"
touch "$state_file"

PATH="$fake_bin:$PATH" FAKE_DOCKER_STATE="$state_file" FAKE_DIGEST="$digest" \
    bash "$repository_root/scripts/release/promote-images.sh" 1.2.3 "ghcr.io/example/backend@$digest" \
    >/dev/null
grep -Fq "ghcr.io/example/backend:1.2.3" "$state_file"
grep -Fq "ghcr.io/example/backend:latest" "$state_file"

first_promotion_lines="$(wc -l <"$state_file")"
PATH="$fake_bin:$PATH" FAKE_DOCKER_STATE="$state_file" FAKE_DIGEST="$digest" \
    bash "$repository_root/scripts/release/promote-images.sh" 1.2.3 "ghcr.io/example/backend@$digest" \
    >/dev/null
[[ "$(wc -l <"$state_file")" -eq $((first_promotion_lines + 2)) ]] || \
    fail "Expected an idempotent promotion to refresh both tags"

expect_failure \
    "Image must use an exact sha256 digest" \
    bash "$repository_root/scripts/release/promote-images.sh" 1.2.3 ghcr.io/example/backend:main

preflight_state="$temporary_directory/preflight-state"
touch "$preflight_state"
expect_failure \
    "Release tag already points to a different image" \
    env PATH="$fake_bin:$PATH" FAKE_DOCKER_STATE="$preflight_state" FAKE_DIGEST="$digest" \
    FAKE_CONFLICT_REF="ghcr.io/example/migration:1.2.3" \
    bash "$repository_root/scripts/release/promote-images.sh" 1.2.3 \
    "ghcr.io/example/backend@$digest" \
    "ghcr.io/example/frontend@$digest" \
    "ghcr.io/example/migration@$digest"
[[ ! -s "$preflight_state" ]] || fail "Promotion started before every image passed preflight"

echo "Release tool tests passed"
