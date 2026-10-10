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

expect_failure \
    "Release tag must use the vMAJOR.MINOR.PATCH format" \
    bash "$repository_root/scripts/release/validate.sh" fit-track-v1.2.3

node - "$repository_root" <<'NODE'
const {readFileSync} = require("node:fs");
const {join} = require("node:path");

const root = process.argv[2];
const releasePleaseConfig = JSON.parse(
    readFileSync(join(root, ".github/release-please/config.json"), "utf8"),
);
const releaseWorkflow = readFileSync(join(root, ".github/workflows/release.yaml"), "utf8");

if (releasePleaseConfig["include-component-in-tag"] !== false) {
    throw new Error("Release Please must create tags without the component prefix");
}

if (!releaseWorkflow.includes('- "v*.*.*"')) {
    throw new Error("Release workflow must trigger for vMAJOR.MINOR.PATCH tags");
}
NODE

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

# Exercise registry operations without accessing GitHub, Docker, or AWS.
registry_bin="$temporary_directory/registry-bin"
mkdir -p "$registry_bin"
cat >"$registry_bin/gh" <<'GH'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ "$*" == *"head_sha=$GITHUB_SHA&branch=main"* ]] || exit 1
case "$SCENARIO" in
    timeout) echo '{"workflow_runs":[]}' ;;
    failed) printf '{"workflow_runs":[{"head_sha":"%s","status":"completed","conclusion":"failure"}]}' "$GITHUB_SHA" ;;
    cancelled) printf '{"workflow_runs":[{"head_sha":"%s","status":"completed","conclusion":"cancelled"}]}' "$GITHUB_SHA" ;;
    api-error) exit 1 ;;
    *)
        if [[ ! -f "$POLL_STATE" ]]; then
            touch "$POLL_STATE"
            echo '{"workflow_runs":[{"head_sha":"other-commit","status":"completed","conclusion":"success"}]}'
        else
            printf '{"workflow_runs":[{"head_sha":"%s","status":"completed","conclusion":"success"}]}' "$GITHUB_SHA"
        fi
        ;;
esac
GH
cat >"$registry_bin/sleep" <<'SLEEP'
#!/usr/bin/env bash
exit 0
SLEEP
cat >"$registry_bin/docker" <<'DOCKER'
#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "$*" == *inspect* ]]; then
    [[ "$*" == *":sha-$GITHUB_SHA"* ]] || exit 1
    [[ "$SCENARIO" != missing-image ]] || exit 1
    if [[ "$SCENARIO" == invalid-digest ]]; then
        echo 'Digest: invalid'
    else
        echo "Digest: $BACKEND_DIGEST"
    fi
else
    [[ "$SCENARIO" != copy-error ]] || exit 1
    echo "$*" >> "$COPY_LOG"
fi
DOCKER
cat >"$registry_bin/aws" <<'AWS'
#!/usr/bin/env bash
set -Eeuo pipefail
[[ "$SCENARIO" != aws-error ]] || exit 1
if [[ "$*" == *backend* ]]; then digest="$BACKEND_DIGEST"; else digest="$MIGRATION_DIGEST"; fi
if [[ "$*" == *--image-ids* ]]; then
    if [[ "$SCENARIO" == mismatch ]]; then echo sha256:bad; else echo "$digest"; fi
else
    case "$SCENARIO" in
        retry) echo "$digest" ;;
        conflict) echo sha256:bad ;;
        *) echo None ;;
    esac
fi
AWS
chmod +x "$registry_bin/gh" "$registry_bin/sleep" "$registry_bin/docker" "$registry_bin/aws"

run_registry_script() {
    local scenario="$1" script="$2"
    env PATH="$registry_bin:$PATH" SCENARIO="$scenario" \
        GITHUB_REPOSITORY=example/project GITHUB_SHA=release-commit \
        GITHUB_REPOSITORY_OWNER=Example REGISTRY=ghcr.io \
        AWS_REGION=eu-central-1 ECR_REGISTRY=example.ecr VERSION=1.2.3 \
        BACKEND_DIGEST="$digest" MIGRATION_DIGEST="sha256:$(printf 'b%.0s' {1..64})" \
        GITHUB_OUTPUT="$temporary_directory/$scenario.outputs" \
        GITHUB_STEP_SUMMARY="$temporary_directory/$scenario.summary" \
        POLL_STATE="$temporary_directory/$scenario.poll" COPY_LOG="$temporary_directory/$scenario.copies" \
        bash "$repository_root/scripts/release/$script"
}

run_registry_script success wait-for-images.sh
[[ "$(wc -l <"$temporary_directory/success.outputs")" -eq 3 ]] || fail "Expected all three image digests"
grep -Fq "frontend-digest=$digest" "$temporary_directory/success.outputs"
for scenario in failed cancelled; do
    expect_failure "Main image publication did not succeed" run_registry_script "$scenario" wait-for-images.sh
done
expect_failure "Timed out waiting" run_registry_script timeout wait-for-images.sh
for scenario in api-error missing-image invalid-digest; do
    if run_registry_script "$scenario" wait-for-images.sh >/dev/null 2>&1; then
        fail "Expected digest resolution to fail: $scenario"
    fi
done

run_registry_script fresh copy-images-to-ecr.sh
[[ "$(wc -l <"$temporary_directory/fresh.copies")" -eq 2 ]] || fail "Expected backend and migration copies"
grep -Fq "backend-ref=example.ecr/fit-track-prod-backend-eu-central-1@$digest" "$temporary_directory/fresh.outputs"
grep -Fq "migration-ref=" "$temporary_directory/fresh.outputs"
run_registry_script retry copy-images-to-ecr.sh
[[ ! -f "$temporary_directory/retry.copies" ]] || fail "Matching immutable tags must not be recopied"
expect_failure "already points to different content" run_registry_script conflict copy-images-to-ecr.sh
expect_failure "ECR digest mismatch" run_registry_script mismatch copy-images-to-ecr.sh
for scenario in aws-error copy-error; do
    if run_registry_script "$scenario" copy-images-to-ecr.sh >/dev/null 2>&1; then
        fail "Expected ECR publication to fail: $scenario"
    fi
    [[ ! -s "$temporary_directory/$scenario.outputs" ]] || fail "Failed publication emitted a reference"
done
[[ ! -f "$temporary_directory/conflict.copies" ]] || fail "Conflicting tags must not be overwritten"

node --test "$repository_root/scripts/deploy/tests/deploy-tools.test.mjs"

echo "Release tool tests passed"
