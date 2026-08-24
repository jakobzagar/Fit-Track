# FitTrack

![FitTrack](frontend/public/brand/fittrack-logo.png)

FitTrack is a production-minded full-stack workout planning and tracking application, designed and built independently as a portfolio project. Users can maintain a personal exercise library, build ordered workouts, record live sessions, compare previous performance, and correct completed training records through an explicit lifecycle.

The repository demonstrates more than a CRUD interface: it treats runtime contracts, authorization, concurrent mutations, database invariants, isolated integration testing, container delivery, and operational failure modes as first-class engineering concerns.

> **Status:** the core workout workflow is complete. Current work focuses on reliability, documentation, delivery, and operational readiness rather than adding unrelated features. A public demo is not available yet; the complete application runs locally with Docker Compose.

## Portfolio overview

| Area              | Evidence in the project                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Product thinking  | Explicit draft → active → completed workout lifecycle, safe cancellation and reopening, exercise history, and previous-performance context |
| Full-stack design | React client, Express application, PostgreSQL persistence, and shared runtime contracts in one TypeScript monorepo                         |
| Data integrity    | Ownership-scoped queries, relational constraints, append-only migrations, serializable transactions, retry handling, and concurrency tests |
| Security          | HTTP-only cookies, CSRF origin checks, credentialed CORS, request limits, rate limiting, security headers, and redacted structured logs    |
| Quality strategy  | Contract, unit, frontend, PostgreSQL integration, accessibility, and final-container smoke coverage                                        |
| Delivery          | Protected pull-request checks, multi-platform containers, digest-pinned verification, SBOM, provenance, and coordinated releases           |

### Suggested review path

1. Scan the [workout lifecycle](#workout-lifecycle) and [engineering highlights](#engineering-highlights).
2. Review the [architecture and data model](docs/architecture.md), including the documented trade-offs.
3. Inspect the [testing strategy](docs/testing.md) to see how each risk is verified.
4. Review the [release process](docs/release-process.md) for build-once, digest-based container promotion.

## Engineering highlights

- **Shared runtime contracts:** frontend and backend consume the same strict Zod request and response schemas from `@fit-track/shared`.
- **Defence at both boundaries:** the backend authoritatively validates untrusted input, while the frontend validates real API responses before using them.
- **Ownership by default:** every protected query is scoped to the authenticated user, including nested workout exercises and sets.
- **Transactional ordering:** workout exercise positions and set numbers remain contiguous after concurrent moves and deletions.
- **Recoverable workout lifecycle:** sessions can be started, cancelled, completed, reopened for corrections, and safely deleted.
- **Real integration environment:** Supertest exercises the exported Express application against migrated PostgreSQL, not an in-memory database.
- **Defensive HTTP defaults:** HTTP-only cookies, CSRF origin checks, restricted credentialed CORS, Helmet, payload limits, and rate limiting.
- **Operational lifecycle:** structured request-correlated logs, separate liveness/readiness checks, graceful shutdown, append-only migrations, non-root containers, Git-addressed image tags, digest-pinned smoke checks, SBOM, and build provenance.

## Product capabilities

- Registration, login, logout, and session restoration
- Personal exercise library with archive and restore
- Workout creation, editing, ordering, and deletion
- Live workout sessions with reps, weight, duration, notes, and set completion
- Previous-performance context for each exercise
- Explicit session cancellation and completed-workout reopening
- Responsive protected routes and an accessible public landing page

## Workout lifecycle

```mermaid
stateDiagram-v2
    state "Draft workout" as Draft
    state "Active session" as Active
    state "Completed record" as Completed

    [*] --> Draft: Create
    Draft --> Active: Start
    Active --> Draft: Cancel
    Active --> Completed: Finish
    Completed --> Active: Reopen
```

A user can have only one active workout. **Cancel** returns it to draft and clears completion marks without discarding entered set values. **Reopen** returns a completed workout to the active session while preserving its recorded data. Any owned workout can be deleted from every lifecycle state together with its nested exercises and sets.

## Architecture

```mermaid
flowchart LR
    User([User]) --> Frontend[React application]
    Frontend -->|/api| API[Express API]
    API --> Database[(PostgreSQL)]

    Contracts[Shared Zod contracts] -.-> Frontend
    Contracts -.-> API
```

```text
fit-track/
├── frontend/          React single-page application organized by feature
├── backend/           Express API, domain services, tests, and Prisma layer
│   └── prisma/        Database schema and append-only migrations
├── shared/            Framework-independent Zod schemas and TypeScript contracts
├── docs/              Architecture, testing, release, and AWS planning
├── compose.dev.yaml   Complete local development stack
└── compose.test.yaml  Isolated verification stack with temporary PostgreSQL
```

The React application sends `/api` requests to the Express API, which persists data in PostgreSQL. Shared Zod contracts keep both applications aligned at the HTTP boundary; API responses return along the same path.

Frontend code is organized around user-facing features, while reusable layout and UI primitives remain outside feature modules. Feature APIs, components, hooks, pages, styles, utilities, and local tests stay with the feature that owns them; empty placeholder directories are not created.

Read [Architecture and design decisions](docs/architecture.md) for request flow, backend layers, data model, security boundaries, and trade-offs.

## Technology stack

| Area           | Technologies                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, Tailwind CSS, Zod                  |
| Backend        | Node.js 24, Express 5, TypeScript, Prisma ORM, Zod, Pino                     |
| Database       | PostgreSQL 17                                                                |
| Authentication | JWT in HTTP-only cookies, bcrypt password hashing                            |
| Testing        | Vitest, Supertest, Testing Library, MSW, axe-core                            |
| Delivery       | Docker Compose, multi-stage containers, GitHub Actions, GHCR, Release Please |

## Quick start

### Requirements

- Docker with Docker Compose
- Git

```bash
git clone https://github.com/jakobzagar/Fit-Track.git
cd Fit-Track
cp .env.dev.example .env.dev
```

Replace the example passwords and `JWT_SECRET` in `.env.dev`, then start the application:

```bash
npm run dev:docker
```

| Service    | Address                                        |
| ---------- | ---------------------------------------------- |
| Frontend   | [http://localhost:5173](http://localhost:5173) |
| API        | [http://localhost:3001](http://localhost:3001) |
| PostgreSQL | `127.0.0.1:5433`                               |

The migration container applies committed migrations before the backend starts. The frontend sends `/api` requests through its development proxy.

Stop the stack without deleting the database volume:

```bash
npm run dev:docker:down
```

For pgAdmin, configure its values in `.env.dev` and start the optional tools profile:

```bash
npm run dev:docker:tools
```

Instructions for running Node.js and PostgreSQL directly are available in [Architecture and design decisions](docs/architecture.md#local-development-without-docker).

Environment files are owned by their launch mode: the Docker stack reads only root `.env.dev`, while direct application processes read `backend/.env` and `frontend/.env`. See [Environment configuration](docs/architecture.md#environment-configuration) for the complete mapping and proxy guidance.

## Verification

Run the fast workspace verification before opening a pull request:

```bash
npm run verify
```

The command generates the Prisma client automatically and does not require a running database. PostgreSQL is required only for the isolated integration suite below.

Run the complete isolated suite for backend behavior, persistence, authorization, concurrency, security middleware, or migrations:

```bash
npm run test:docker
```

| Layer               | Responsibility                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| Shared contracts    | Validation boundaries, normalization, and strict response shapes                 |
| Backend unit        | Middleware, transaction retry logic, cookies, and graceful shutdown              |
| Backend integration | HTTP behavior against migrated PostgreSQL, ownership, lifecycle, and concurrency |
| Frontend            | User interactions, state transitions, API failures, routing, and accessibility   |
| Production smoke    | Final container startup, migrations, Nginx static serving, and Nginx → API proxy |

See [Testing strategy](docs/testing.md) for suite boundaries, database safety, commands, and test conventions.

## Design decisions

- **HTTP-only cookies over browser storage:** JavaScript cannot read the authentication token; same-origin state-changing requests are additionally protected by CSRF origin checks.
- **Runtime schemas over TypeScript-only contracts:** compile-time types cannot validate JSON received over the network, so successful and error responses are parsed at the client boundary.
- **A real relational test database:** ownership, foreign keys, cascades, uniqueness, ordering, and transaction conflicts depend on PostgreSQL behavior.
- **Archive exercises, preserve history:** an exercise referenced by previous workouts remains available to historical records even when removed from the active library.
- **Explicit lifecycle corrections:** completed workouts remain read-only until the user deliberately reopens them, making accidental history changes less likely.
- **Separate migration artifact:** schema changes run once before the matching backend revision rather than from every application replica.

More context and accepted trade-offs are documented in [Architecture and design decisions](docs/architecture.md#design-decisions-and-trade-offs).

## Security and operational boundaries

The API restricts credentialed CORS to the configured frontend origin, checks CSRF origins for state-changing requests, limits JSON bodies to 100 KB, uses Helmet security headers, and returns sanitized unexpected errors. Production cookies are secure and HTTP-only.

The current rate limiter uses process-local memory and is suitable for the present single-process runtime. Multiple backend processes require a shared store if limits must be global. The backend emits redacted JSON logs to standard output in production, attaches a generated request ID to each response, and uses readable pretty-printing only during local development.

The planned deployment target is AWS, with an Application Load Balancer routing to separate frontend and backend ECS services, an ECS migration task, and RDS PostgreSQL. That infrastructure is not implemented in this repository yet, so HTTPS termination, managed secrets, backups, monitoring, and deployment remain explicit pre-production work described in the [AWS deployment plan](docs/aws-deployment-plan.md).

## Delivery

`main` is the protected integration branch. Contributors work on short-lived branches, open pull requests, and merge only after `Actions lint`, `Verify`, `Integration`, and `Production container smoke` succeed. Failed checks leave `main` unchanged and are corrected by pushing another commit to the same pull-request branch.

FitTrack uses `1.0.0` as its planned first production release and maintained version baseline. The root package, all workspaces, package lock, Release Please manifest, and changelog carry the same product version.

Successful commits on `main` publish three multi-platform images from the same tested revision:

- `fit-track-backend`
- `fit-track-frontend`
- `fit-track-migration`

Images receive Git-addressed `sha-<commit>` tags, SBOM attestations, and build provenance. A rerun may replace a SHA tag, while smoke tests pin the exact digest returned by each successful build before promoting it to the moving `main` tag. After the one-time `v1.0.0` production-baseline bootstrap, Release Please manages later product versions and promotes existing image digests without rebuilding them.

See [Release and container process](docs/release-process.md#protected-main-workflow) for the branch workflow, repository ruleset, migration ordering, image tags, local workflow checks, and release operations.

## Documentation

- [Domain language](CONTEXT.md)
- [Architecture and design decisions](docs/architecture.md)
- [Testing strategy](docs/testing.md)
- [Release and container process](docs/release-process.md)
- [AWS deployment plan](docs/aws-deployment-plan.md)

## Author

Designed and implemented by [Jakob Zagar](https://github.com/jakobzagar) as an independent portfolio project.
