# FitTrack contributor guide

## Repository map

FitTrack is a TypeScript monorepo:

- `frontend/`: React, Vite, Tailwind CSS, and browser tests;
- `backend/`: Express, Prisma, PostgreSQL, and API tests;
- `shared/`: framework-independent Zod contracts used by both applications;
- `backend/prisma/`: schema and append-only migrations;
- `docs/`: architecture, testing, release, and planned deployment documentation.

Do not edit generated Prisma files under `backend/generated/`.

## Default workflow

1. Inspect the current branch, `git status`, and the nearest relevant source and tests. Preserve unrelated user changes.
2. Make the smallest coherent change. Keep shared contracts, backend behavior, frontend consumers, and tests aligned.
3. Run the narrowest useful check while iterating, then the required validation from the table below.
4. Update only the document that owns the changed topic.
5. Review the final diff for unrelated edits, generated files, secrets, and accidental version changes.
6. Report exactly what changed, what passed, and what was not run.

Never commit credentials, `.env` files, database dumps, generated secrets, or user data. Commit or push only when the user explicitly requests it.

## Validation

| Change                                      | Required local validation                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| TypeScript behavior or configuration        | Narrow tests while iterating, then `npm run verify`                                |
| API, authorization, persistence, migrations | `npm run verify` and `npm run test:docker`                                         |
| Docker, Nginx, health checks, startup       | `npm run verify` and the production-container smoke procedure in `docs/testing.md` |
| GitHub Actions workflow or local action     | `npm run actions:lint` plus the relevant repository checks                         |
| Markdown or non-workflow YAML only          | Prettier on changed files, link/content review, and `git diff --check`             |

Useful commands:

```bash
npm run verify
npm run test:docker
npm run test:docker:down
npm run actions:lint
```

`npm run verify` covers linting, type checking, formatting, fast tests, and builds without requiring PostgreSQL. `npm run test:docker` uses an isolated temporary PostgreSQL database. Never point integration tests at development or production data, and never claim a check passed when it was not run.

## Code boundaries

- Prefer schemas from `@fit-track/shared` whenever a contract crosses the frontend/backend boundary.
- Keep backend routes thin: middleware handles cross-cutting concerns, controllers translate HTTP, services own business rules, and Prisma owns persistence.
- Validate request bodies, parameters, query strings, environment variables, and API responses at their boundaries.
- Return errors through `AppError` and the central error middleware.
- Scope every protected read and mutation to the authenticated owner, including nested resources.
- Preserve the feature-based frontend structure under `frontend/src/features/` and reusable components under `frontend/src/components/`.
- Use existing responsibility directories; do not create empty placeholders or unrelated abstractions.
- Follow the existing ESM, TypeScript, ESLint, and Prettier conventions. Backend relative imports include `.js` where required by the compiler setup.
- Prefer semantic HTML, accessible labels, visible focus, and clear loading and error states.

## Tests

- Add tests for observable behavior changes and regression tests for bug fixes.
- Put shared schema matrices beside their domain under `shared`, backend integration tests in the owning module, and frontend tests beside the owning feature or component.
- Use Supertest against the exported Express app, Testing Library with accessible queries, `user-event` for interactions, and MSW for frontend HTTP boundaries.
- Preserve the test database guard: destructive cleanup requires `NODE_ENV=test` and a database name ending in `_test`.
- Do not weaken assertions or rewrite expected behavior merely to make a failing test pass.

Detailed suite responsibilities and smoke commands belong in [docs/testing.md](docs/testing.md).

## Database, security, and runtime

- Every schema change requires a new Prisma migration. Do not modify an existing committed migration unless the task explicitly addresses an unreleased migration.
- Run migrations once through the dedicated migration image before the matching backend revision; never from every backend replica at startup.
- Use transactions for multi-step writes and consider ownership, uniqueness, indexes, deletion behavior, and existing data.
- Preserve HTTP-only secure production cookies, credentialed CORS, CSRF origin checks, Helmet, CSP, payload limits, rate limiting, and `Cache-Control: no-store` for API responses.
- Never log passwords, JWTs, cookies, authorization headers, secrets, or sensitive request bodies.
- Keep liveness independent of external services and readiness dependent on PostgreSQL.
- Keep container logs on standard output and error.
- The current production frontend is Nginx and proxies `/api` to `backend:3001`. Changes to that contract, Docker stages, ports, health checks, or startup commands require production-container smoke validation and matching documentation.
- AWS is planned but not implemented. Do not describe proposed AWS resources as existing or verified.

Environment ownership is strict: `.env.dev` belongs to Docker Compose; `backend/.env` and `frontend/.env` belong to directly started processes. Their tracked `*.example` files are authoritative. Full environment rules belong in [docs/architecture.md](docs/architecture.md#environment-configuration).

## Documentation ownership

- `README.md`: concise public overview, quick start, verification entry points, and links.
- `docs/architecture.md`: code structure, domain model, trust boundaries, runtime behavior, and design decisions.
- `docs/testing.md`: suite responsibilities, database safety, and test commands.
- `docs/release-process.md`: protected-main flow, image publication, migrations, versions, and releases.
- `docs/aws-deployment-plan.md`: current deployment readiness and planned AWS topology only.
- `CHANGELOG.md`: release history generated by Release Please after the initial `1.0.0` baseline.

Update the narrowest owner and link to it from summaries. Do not copy detailed procedures or explanations between documents.

## Git and releases

- `main` is protected. Normal changes use a short-lived branch and pull request; later pushes update the same PR.
- Merge only after the branch is current, conversations are resolved, and `Actions lint`, `Verify`, `Integration`, and `Production container smoke` pass.
- Use Conventional Commits without scopes: `feat:`, `fix:`, `perf:`, `test:`, `docs:`, `ci:`, `build:`, or `chore:` followed by a concise imperative summary.
- Treat `fix:` and `perf:` as patch, `feat:` as minor, and `!` or `BREAKING CHANGE` as major release input. Use `Release-As` only for an intentional override.
- Do not manually edit product versions or the changelog during ordinary work. Release Please owns coordinated releases after the documented `v1.0.0` bootstrap.
- Inspect recent history before committing, keep unrelated concerns separate, and include directly related tests with behavior changes.

The complete branch, image, version, and release flow belongs in [docs/release-process.md](docs/release-process.md).

## Definition of done

- The requested change is focused and complete.
- Contracts, API behavior, UI consumers, migrations, environment examples, tests, and documentation are aligned where relevant.
- Required validation passed, or each unrun/failed check is reported precisely.
- The final diff contains no unrelated edits, secrets, generated artifacts, or unintended version changes.
