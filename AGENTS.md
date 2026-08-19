# FitTrack contributor guide

## Project overview

FitTrack is a TypeScript monorepo for planning workouts and recording exercise sets.

- `frontend/`: React 19 single-page application built with Vite and Tailwind CSS.
- `backend/`: Express 5 REST API using Prisma and PostgreSQL.
- `shared/`: framework-independent Zod schemas and TypeScript contracts shared by the apps.
- `docs/`: focused architecture, testing, release, and portfolio documentation.
- `backend/prisma/`: database schema and append-only migrations.
- `compose.dev.yaml`: complete local development stack.
- `compose.test.yaml` and `test.Dockerfile`: isolated verification stack with a temporary PostgreSQL database.

## Working principles

- Read the nearest relevant source files before changing behavior.
- Keep changes focused on the requested task; do not perform unrelated refactors.
- Preserve the workspace boundaries and the existing feature-based folder structure.
- Prefer shared schemas from `@fit-track/shared` when a contract is used by both applications.
- Keep server-side authorization and validation authoritative. Client checks are user experience, not security boundaries.
- Never commit credentials, generated secrets, `.env` files, database dumps, or user data.
- Keep environment files scoped to their launch mode: root `.env.dev` is for Docker Compose, while `backend/.env` and `frontend/.env` are for direct local processes. Keep their tracked `*.example` templates authoritative.
- Do not edit generated Prisma client files under `backend/generated/`.

## Documentation ownership

- Keep `README.md` concise and recruiter-friendly: product value, engineering highlights, quick start, verification, and links to deeper material.
- Keep architecture, trust boundaries, domain invariants, and design trade-offs in `docs/architecture.md`.
- Keep suite responsibilities and test-environment instructions in `docs/testing.md`.
- Keep image publication, migration ordering, and release operations in `docs/release-process.md`.
- Update the narrowest relevant document when behavior, setup, architecture, or delivery changes; avoid copying the same operational detail into multiple files.

## Local setup

The supported runtime is Node.js 24 or newer with npm 11. Install dependencies from the repository root:

```bash
npm ci
```

The simplest development environment uses Docker Compose:

```bash
cp .env.dev.example .env.dev
npm run dev:docker
```

Use `npm run dev:docker:debug` for backend debugging and `npm run dev:docker:down` to remove the development containers without deleting database volumes. Run individual applications from the repository root with `npm run dev:backend` and `npm run dev:frontend`. A PostgreSQL instance and correctly configured environment files are required when running outside Docker.

## Validation commands

Run the narrowest useful validation while iterating, then run the full verification before handing off a change:

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
npm run verify
```

`npm run verify:integration` extends the normal verification with backend integration tests. It expects an already available migrated test database and is normally invoked by the Docker test stack.

`npm test` runs the fast workspace tests, including shared contract, backend unit, and frontend tests. Backend integration tests require the isolated Docker stack because they use a real PostgreSQL database:

```bash
npm run test:docker
```

The Docker command applies committed migrations to a temporary `fit_track_test` database and then runs `npm run verify:integration`. Clean up an interrupted test stack with `npm run test:docker:down`. Never point integration tests at a development or production database, and never claim tests passed if they were not run.

## Test conventions

- Add or update tests whenever a feature changes observable behavior. Choose only the test layers relevant to the change rather than modifying every suite.
- Update shared contract tests for new or changed schemas, backend integration tests for API behavior or business rules, and frontend tests for important user interactions.
- Keep exhaustive validation boundary matrices in `shared`; frontend form tests should focus on error presentation, accessibility, submission, and normalization instead of repeating every schema case.
- Do not add standalone tests for pass-through presentational components unless they own meaningful behavior, semantics, or an accessibility contract.
- For bug fixes, add a regression test that reproduces the failure before or alongside the fix.
- Pure styling changes normally do not require tests. Refactors that preserve behavior should keep existing tests passing without rewriting their expectations.
- Do not weaken assertions or update expected results merely to make a failing test pass; first determine whether the requirement changed or the test exposed a regression.
- Keep shared schemas in each domain's `schemas/` directory and their contract tests in the sibling `tests/` directory as `*.test.ts`.
- Keep backend integration tests inside their owning module's `tests/` directory as `*.integration.test.ts`.
- Keep isolated backend unit tests inside the owning area's `tests/` directory as `*.test.ts`; they must not depend on PostgreSQL or the integration setup.
- Use Vitest and Supertest to exercise the exported Express app without starting a separate backend HTTP service.
- Use the helpers under `backend/src/test/` for authenticated requests, fixtures, database cleanup, and connection teardown.
- Preserve the test database guard: destructive cleanup is allowed only with `NODE_ENV=test` and a database name ending in `_test`.
- Test successful behavior, validation failures, authentication, CSRF protection, ownership boundaries, and important relational or lifecycle constraints.
- For nested protected resources, verify both cross-user access and valid child IDs supplied under mismatched parent IDs.
- Keep backend integration test files sequential unless their database isolation strategy is deliberately changed.
- Keep frontend tests in the owning feature's local `tests/` directory as `*.test.tsx` or `*.test.ts` and run them with the frontend Vitest jsdom environment.
- Use Testing Library queries based on accessible roles and labels, and prefer `user-event` for interactions.
- Use `renderWithProviders` from `frontend/src/test/render.tsx` when components need application providers or routing.
- Mock frontend HTTP boundaries with MSW. Unhandled requests must remain test failures, and handlers must be reset after every test.

## Code conventions

- Follow the existing TypeScript, ESLint, and Prettier configuration.
- Use ESM imports and include `.js` extensions in backend relative imports where the existing compiler setup requires them.
- Keep route handlers thin: routes define middleware, controllers translate HTTP concerns, services contain business logic, and Prisma owns persistence.
- Validate request bodies, parameters, query strings, environment variables, and API responses at their boundaries.
- Return errors through the existing `AppError` and error middleware flow rather than introducing ad hoc response shapes.
- Maintain user ownership checks for every protected resource query and mutation.
- Preserve the frontend feature organization under `frontend/src/features/` and reusable primitives under `frontend/src/components/`.
- Group existing source files by responsibility even when a category currently contains only one file. Use predictable directories such as `api/`, `components/`, `controllers/`, `hooks/`, `middleware/`, `pages/`, `policies/`, `routes/`, `schemas/`, `services/`, `styles/`, `tests/`, `types/`, and `utils/` where applicable.
- Do not create empty placeholder directories. Workspace entrypoints and conventional configuration files may remain at their expected roots.
- Prefer accessible semantic HTML, visible focus states, clear loading/error feedback, and responsive layouts.

## Database changes

- Update `backend/prisma/schema.prisma` and create a new Prisma migration for every schema change.
- Never modify an existing committed migration unless the task explicitly concerns an unreleased migration and the impact is understood.
- Run committed migrations through the dedicated migration target or another controlled one-off job before starting the corresponding backend version; do not run migrations independently from every backend replica at application startup.
- Use transactions for multi-step writes that must succeed or fail together.
- Consider ownership, uniqueness, indexes, deletion behavior, and existing data before changing a model.

## Runtime expectations

- The production frontend Nginx configuration currently proxies `/api` to `backend:3001`. Preserve that shared-network contract or update the proxy and its documentation together when the runtime topology changes.
- The current rate limiters use process-local memory. Do not assume their counters are shared across backend processes; configure a shared store before relying on global limits in a multi-process runtime.
- Keep liveness independent of external services and use readiness for PostgreSQL availability.
- Keep container logs on standard output and error. Never add passwords, JWTs, cookies, secrets, or sensitive request bodies to logs.
- Changes to production Docker stages, Nginx routing, health checks, ports, or startup commands require a production-container smoke check in addition to the normal verification commands. Report clearly when that check was not run.

## Security expectations

- Authentication uses an HTTP-only cookie. Preserve secure production cookie behavior, CORS credentials, CSRF origin checks, Helmet, payload limits, and rate limiting.
- Do not log passwords, tokens, cookies, secrets, or sensitive request bodies.
- Treat all client input as untrusted and keep Zod validation in place.
- Do not weaken authorization, security middleware, or production defaults to make local development easier.

## Commit conventions

- Follow the repository's existing Conventional Commits style: `<type>: <imperative summary>`.
- Do not add scopes in parentheses; use `feat:`, `fix:`, `test:`, `docs:`, `build:`, `chore:`, and similar prefixes directly.
- Treat commit types as release inputs: `fix:` requests a patch, `feat:` requests a minor, and a `!` or `BREAKING CHANGE` footer requests a major release. Use non-releasable types such as `docs:`, `test:`, `ci:`, or `chore:` when no product release is warranted.
- Use a `Release-As: MAJOR.MINOR.PATCH` commit footer only when intentionally overriding the next version proposed by Release Please.
- Keep the summary concise, lowercase, and focused on the outcome, for example `feat: protect unsaved workout session edits`.
- Split unrelated concerns into separate commits, and include directly related tests in the same commit as the behavior they cover.
- Inspect recent commit history before committing and match its established wording and granularity.

## Definition of done

- The requested behavior is implemented without unrelated changes.
- Shared contracts, API behavior, and UI consumers remain aligned.
- Migrations and environment examples are updated when required.
- `npm run verify` passes, or any pre-existing/unrelated failure is reported precisely.
- `npm run test:docker` passes for backend behavior, persistence, authorization, migration, or integration-test changes.
- User-facing behavior is manually checked when automated coverage is unavailable.
- Documentation is updated if setup, architecture, commands, or public behavior changed.
