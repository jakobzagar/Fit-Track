#!/usr/bin/env bash

set -Eeuo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repository_root"

e2e_database_port="${E2E_DATABASE_PORT:-15433}"
e2e_backend_port="${E2E_BACKEND_PORT:-13002}"
e2e_frontend_port="${E2E_FRONTEND_PORT:-15173}"
compose=(docker compose -f compose.e2e.yaml)

cleanup() {
    "${compose[@]}" down --volumes --remove-orphans
}

trap cleanup EXIT

export E2E_DATABASE_PORT="$e2e_database_port"
export E2E_BACKEND_PORT="$e2e_backend_port"
export E2E_FRONTEND_PORT="$e2e_frontend_port"
export NODE_ENV=test
export PORT="$e2e_backend_port"
export DATABASE_URL="postgresql://fit_track_e2e:fit_track_e2e_password@127.0.0.1:${e2e_database_port}/fit_track_e2e_test"
export JWT_SECRET="fit-track-e2e-secret-that-is-at-least-32-characters"
export CLIENT_ORIGIN="http://127.0.0.1:${e2e_frontend_port}"
export API_PROXY_TARGET="http://127.0.0.1:${e2e_backend_port}"
export TRUST_PROXY_HOPS=0
export LOG_LEVEL=warn

"${compose[@]}" up --detach --wait
npm run build:shared
npm run generate --workspace @fit-track/backend
npm exec --workspace @fit-track/backend -- prisma migrate deploy
npm run test:e2e:runner --workspace @fit-track/frontend -- "$@"
