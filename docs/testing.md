# Testing strategy

FitTrack separates tests by responsibility so failures point to the correct boundary. The suite uses Vitest throughout, Testing Library and MSW in the frontend, and Supertest with PostgreSQL in backend integration tests.

## Risk-to-evidence map

| Engineering risk                    | Verification evidence                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Frontend and backend contract drift | Shared strict Zod matrices, backend response parsing, and frontend runtime response parsing                      |
| Cross-user data exposure            | Integration tests for owned resources, nested-resource mismatches, and previous-performance isolation            |
| Invalid lifecycle transitions       | Service and integration coverage for start, cancel, finish, reopen, and delete behavior                          |
| Concurrent ordering corruption      | PostgreSQL integration tests for simultaneous exercise/set insertion, reordering, and lifecycle transitions      |
| Browser regressions                 | Testing Library interactions, MSW network behavior, route/session tests, and axe-core accessibility smoke checks |
| Static security flaws               | GitHub-managed CodeQL analysis for JavaScript and TypeScript data flows                                          |
| Vulnerable dependency introduction  | Pull-request dependency review for high and critical runtime advisories                                          |
| Artifact/runtime drift              | Final backend, migration, and Nginx images exercised together by the production-container smoke suite            |
| Release version drift               | Release validation checks the tag against packages, lockfile, manifest, and changelog                            |

Tests cross the same Interface used by production callers wherever practical. This keeps the test surface aligned with observable behavior and avoids coupling assertions to private Implementation details.

## Test layers

| Layer               | Location                                  | Primary responsibility                                                            |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------------- |
| Shared contract     | Domain `tests/` directories               | Validation matrices, normalization, strict request and response shapes            |
| Backend unit        | Owning area `tests/` directories          | Environment parsing, logging, middleware, cookies, proxy trust, retries, shutdown |
| Backend integration | Module `tests/` directories               | HTTP, PostgreSQL, ownership, nested resources, lifecycle, concurrency             |
| Frontend            | Feature or component `tests/` directories | User interaction, error feedback, routing, accessibility, state transitions       |
| Code scanning       | GitHub CodeQL default setup               | JavaScript and TypeScript security queries on repository changes                  |
| Dependency review   | `Test` workflow pull-request job          | Added and updated dependencies compared with the pull-request base                |
| Release             | `scripts/release/tests/`                  | Coordinated version validation across release artifacts                           |
| Production smoke    | `compose.production-smoke.yaml`           | Final images, migrations, health checks, Nginx static serving and API proxy       |

## Fast verification

```bash
npm run verify
```

This command generates the Prisma client, then runs linting, type checking, formatting checks, fast workspace tests, and production builds. Prisma generation uses a local placeholder URL when `DATABASE_URL` is unset and does not connect to PostgreSQL. The command intentionally excludes PostgreSQL integration tests.

Useful narrower commands are:

| Command                   | Purpose                                                   |
| ------------------------- | --------------------------------------------------------- |
| `npm test`                | Run all fast workspace tests                              |
| `npm run test:release`    | Test coordinated release-version validation               |
| `npm run check`           | Run lint, type checking, and formatting checks            |
| `npm run verify:shared`   | Verify the shared package                                 |
| `npm run verify:backend`  | Verify backend unit tests, compilation, and static checks |
| `npm run verify:frontend` | Verify frontend checks, tests, and build                  |

## Isolated PostgreSQL verification

```bash
npm run test:docker
```

The Docker stack:

1. creates a temporary PostgreSQL database on `tmpfs`;
2. waits for PostgreSQL readiness;
3. applies every committed migration with `prisma migrate deploy`;
4. runs the complete fast verification;
5. runs backend integration tests sequentially;
6. returns the test container's exit code.

Remove an interrupted stack before retrying:

```bash
npm run test:docker:down
```

Never point integration tests at development or production data. Destructive test cleanup is guarded by `NODE_ENV=test` and requires a database name ending in `_test`.

## Production container smoke tests

Pull requests run a production container smoke job after fast verification succeeds. It builds the final backend, migration, and frontend targets for the runner platform and rejects Dockerfile, migration startup, health-check, static-serving, or proxy regressions before merge. The job runs for every pull request, including documentation-only changes, so the protected-branch checks are always reported and cannot remain pending because a workflow was skipped by a path filter.

After a merge to `main`, the image-publishing workflow repeats the runtime checks against the exact multi-platform content digests returned by the GHCR build before promoting them to `main`. A release-tag workflow independently builds the tagged revision and runs the same suite before assigning the exact version and `latest` tags to its build digests. A rerun may replace a Git-addressed SHA tag, but neither workflow uses that movable tag as its promotion input. The pull-request gate checks proposed source; the registry runs prove that the published deployment artifacts work. None replaces browser end-to-end or PostgreSQL integration tests.

The temporary stack starts PostgreSQL on `tmpfs`, applies committed migrations using the final migration image, then starts the final backend and Nginx images. It verifies the Nginx health endpoint, backend liveness and readiness directly, the same requests through Nginx `/api`, the SPA entry document and external theme initializer, frontend security headers, static revalidation policy, and API `no-store` behavior.

For a local run, build and start the same final targets:

```bash
docker build --target production --tag fit-track-backend:smoke -f backend/Dockerfile .
docker build --target migration --tag fit-track-migration:smoke -f backend/Dockerfile .
docker build --target production --tag fit-track-frontend:smoke -f frontend/Dockerfile .
npm run smoke:production
```

The smoke script prints container logs on failure and always removes its temporary containers, network, and volumes. Set `SMOKE_BACKEND_PORT` or `SMOKE_FRONTEND_PORT` when the defaults `13001` and `18080` are unavailable.

## Contract testing

Shared schema tests own exhaustive validation boundaries. Backend integration tests parse real endpoint responses through those same schemas, catching drift between controllers and published contracts. The frontend API client performs the same runtime parsing before returning data to features.

Frontend form tests therefore focus on behavior that belongs to the browser:

- accessible labels and errors;
- normalized submissions;
- loading and failure feedback;
- dialog and navigation behavior;
- important state updates.

They do not repeat every validation case already covered by the shared package.

## Backend integration coverage

Integration tests exercise the exported Express app without starting a separate API process. Important coverage includes:

- successful and rejected authentication;
- secure cookie behavior and CSRF origins;
- request validation and malformed payloads;
- ownership and cross-user access;
- valid child IDs under mismatched parent IDs;
- archive and restore behavior;
- workout lifecycle transitions;
- contiguous exercise positions and set numbers;
- concurrent lifecycle and ordering mutations;
- exhausted transaction retries returning a stable `503`;
- liveness and database readiness.

Integration files remain sequential because they share one test database. Parallel execution would require an explicit isolation strategy such as separate schemas or databases.

## Frontend test infrastructure

Frontend tests run in jsdom. `renderWithProviders` supplies application providers and routing. MSW owns the HTTP boundary, resets handlers after every test, and treats unhandled requests as failures.

Testing Library queries use accessible roles and labels. `user-event` is preferred for realistic interaction. axe-core provides accessibility smoke coverage for representative pages and dialogs.

Pure presentational pass-through components do not receive standalone tests unless they own meaningful semantics or accessibility behavior.

## Code scanning

CodeQL should use GitHub's default setup so its configuration remains visible and maintainable in repository settings rather than adding another workflow file. A repository administrator enables it once:

1. open the repository's **Settings**;
2. under **Security and quality**, select **Advanced Security**;
3. under **Code Security**, find **CodeQL analysis** and select **Set up** → **Default**;
4. keep **JavaScript/TypeScript** enabled and begin with the **Default** query suite;
5. review the generated configuration and select **Enable CodeQL**.

The first run validates the generated configuration. Results and remediation details appear under **Security** → **Code scanning**. JavaScript and TypeScript analysis does not require PostgreSQL, private environment files, or a custom build command.

After the first successful run, add the exact CodeQL status reported by GitHub—normally similar to `CodeQL / Analyze (javascript-typescript)`—to the protected `main` ruleset. Do not guess the status name before GitHub creates it. The [official default-setup guide](https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configure-code-scanning) owns current eligibility and UI details.

## Dependency review

The `Dependency review` job runs only on pull requests and compares dependency changes with the pull-request base through GitHub's dependency graph. It blocks newly introduced `high` or `critical` vulnerabilities in runtime dependencies and reports the first patched version when GitHub Advisory Database data provides one. Development-only findings remain visible without blocking the pull request; this keeps known build-tool findings separate from production exposure.

This check complements rather than replaces Dependabot alerts: dependency review prevents vulnerable changes from entering `main`, while Dependabot reports vulnerabilities already present in the dependency graph. It uses only the read-only workflow token, does not post pull-request comments, and requires no external account or repository secret.

Public repositories have the dependency graph available on GitHub.com. For an eligible private repository, enable the dependency graph before requiring the check. After the first successful pull-request run, add the exact `Dependency review` status to the protected `main` ruleset. The [official dependency-review documentation](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review) owns current eligibility and behavior.

## Regression policy

Observable behavior changes require tests at the layer that owns the behavior. Bug fixes add a regression case that reproduces the failure. Refactors should preserve existing expectations rather than weakening assertions to make tests pass.

When backend persistence, authorization, security middleware, concurrency, or migrations change, both `npm run verify` and `npm run test:docker` are required before handoff.

## Pull request quality gate

The protected `main` branch requires these exact GitHub Actions job names:

- `Actions lint` validates workflow syntax;
- `Dependency review` rejects newly introduced high or critical runtime vulnerabilities;
- `Verify` runs linting, type checking, formatting, fast tests, and production builds;
- `Integration` applies committed migrations and tests the API against PostgreSQL;
- `Production container smoke` builds and exercises the final runtime targets.

The complete merge policy, correction flow, and repository ruleset belong in the [release and container process](release-process.md#protected-main-workflow).
