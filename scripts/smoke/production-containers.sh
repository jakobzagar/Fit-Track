#!/usr/bin/env bash

set -Eeuo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd -- "$script_directory/../.." && pwd)"
compose_file="$repository_root/compose.production-smoke.yaml"
frontend_url="http://127.0.0.1:${SMOKE_FRONTEND_PORT:-18080}"
backend_url="http://127.0.0.1:${SMOKE_BACKEND_PORT:-13001}"
compose=(docker compose --project-directory "$repository_root" -f "$compose_file")

cleanup() {
    exit_code=$?
    trap - EXIT

    if [[ "$exit_code" -ne 0 ]]; then
        "${compose[@]}" logs --no-color || true
    fi

    "${compose[@]}" down --volumes --remove-orphans || true
    exit "$exit_code"
}

assert_http_ok() {
    curl --fail --silent --show-error "$1" >/dev/null
}

assert_body_contains() {
    curl --fail --silent --show-error "$1" | grep --fixed-strings --quiet "$2"
}

assert_header() {
    url="$1"
    expected_status="$2"
    expected_header="$3"
    response="$(curl --silent --show-error --head --write-out $'\n%{http_code}' "$url")"
    actual_status="${response##*$'\n'}"
    headers="${response%$'\n'*}"

    if [[ "$actual_status" != "$expected_status" ]]; then
        echo "Expected $url to return $expected_status, received $actual_status" >&2
        return 1
    fi

    if ! grep --fixed-strings --ignore-case --quiet "$expected_header" <<<"$headers"; then
        echo "Expected $url to include header: $expected_header" >&2
        return 1
    fi
}

trap cleanup EXIT

"${compose[@]}" up --detach --wait --wait-timeout 120

assert_http_ok "$frontend_url/health"
assert_http_ok "$backend_url/api/health/live"
assert_http_ok "$backend_url/api/health/ready"
assert_http_ok "$frontend_url/api/health/ready"
assert_body_contains "$frontend_url/" '<div id="root">'
assert_body_contains "$frontend_url/theme-init.js" "fittrack-theme"

index_html="$(curl --fail --silent --show-error "$frontend_url/")"
asset_path="$(printf '%s' "$index_html" | grep --only-matching --extended-regexp '/assets/[^\"]+\.(js|css)' | sed -n '1p' || true)"
if [[ -z "$asset_path" ]]; then
    echo "Expected the frontend entry document to reference a hashed asset" >&2
    exit 1
fi

assert_header "$frontend_url/" 200 "Content-Security-Policy: default-src 'self';"
assert_header "$frontend_url/" 200 "Referrer-Policy: strict-origin-when-cross-origin"
assert_header "$frontend_url/" 200 "Permissions-Policy: camera=(), geolocation=(), microphone=()"
assert_header "$frontend_url/" 200 "X-Content-Type-Options: nosniff"
assert_header "$frontend_url/" 200 "X-Frame-Options: DENY"
assert_header "$frontend_url/" 200 "Cross-Origin-Opener-Policy: same-origin"
assert_header "$frontend_url/" 200 "Cross-Origin-Resource-Policy: same-origin"
assert_header "$frontend_url/index.html" 200 "Cache-Control: no-cache"
assert_header "$frontend_url/theme-init.js" 200 "Cache-Control: no-cache"
assert_header "$frontend_url$asset_path" 200 "Cache-Control: public, max-age=31536000, immutable"
assert_header "$backend_url/api/health/live" 200 "Cache-Control: no-store"
assert_header "$frontend_url/api/health/live" 200 "Cache-Control: no-store"
assert_header "$backend_url/api" 404 "Cache-Control: no-store"
assert_header "$frontend_url/api" 404 "Cache-Control: no-store"
assert_header "$backend_url/api/not-found" 404 "Cache-Control: no-store"
assert_header "$frontend_url/api/not-found" 404 "Cache-Control: no-store"

echo "Production container smoke checks passed"
