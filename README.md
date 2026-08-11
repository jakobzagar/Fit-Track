# FitTrack

![FitTrack](frontend/public/brand/fittrack-logo.png)

FitTrack is a full-stack workout planning and tracking application. It provides a focused space to create an exercise library, build workouts, run training sessions, and record completed sets.

This repository is a portfolio project built to demonstrate production-oriented full-stack development: a typed monorepo, shared validation contracts, authenticated REST APIs, relational data modelling, database migrations, containerized environments, and defensive backend defaults.

> **Project status:** actively developed. The core workout workflow is functional, with shared contract tests and isolated backend integration coverage in place.

## Features

- Account registration, login, logout, and session restoration
- Per-user exercise library with archive and restore support
- Workout creation, editing, deletion, and lifecycle states
- Exercises and ordered sets within a workout
- Reps, weight, duration, notes, and set completion tracking
- Previous-performance context during workout sessions
- Responsive protected application routes and public landing page

## Tech stack

| Area           | Technologies                                                                             |
| -------------- | ---------------------------------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, Tailwind CSS, Zod                              |
| Backend        | Node.js 24, Express 5, TypeScript, Prisma ORM, Zod                                       |
| Database       | PostgreSQL 17                                                                            |
| Authentication | JWT in HTTP-only cookies, bcrypt password hashing                                        |
| Tooling        | npm workspaces, Vitest, Testing Library, MSW, axe-core, ESLint, Prettier, Docker Compose |

## Architecture

```text
fit-track/
├── frontend/          React single-page application
├── backend/           Express REST API and Prisma data layer
│   └── prisma/        Schema and database migrations
├── shared/            Shared request, response, and validation contracts
└── compose.dev.yaml   Local containerized development stack
```

The repository uses npm workspaces. The frontend and backend consume `@fit-track/shared`, keeping request validation, response shapes, and TypeScript contracts consistent across application boundaries. The backend validates untrusted request data before controllers run, while the frontend validates actual JSON responses at the HTTP boundary. Backend integration tests parse real endpoint responses with the same shared schemas to catch contract drift before deployment. Backend features follow a route → controller → service structure, while frontend code is organized by feature.

Large features are subdivided only when the extra level represents a useful domain boundary. For example, backend workout modules keep `services/`, `policies/`, and local `tests/`, while frontend workout components are grouped into `forms/`, `list/`, `details/`, and `session/`. Workout-exercise UI separates exercise-level controls from set-level controls. Smaller features remain flat to avoid unnecessary navigation and empty structural layers. Each frontend feature collects its tests in a local `tests/` directory, while shared test infrastructure remains under `frontend/src/test/`.

## Getting started

### Prerequisites

- Docker with Docker Compose
- Alternatively, Node.js 24.18+, npm 11+, and PostgreSQL

### Docker development environment

1. Clone the repository and enter it:

    ```bash
    git clone https://github.com/jakobzagar/Fit-Track.git
    cd Fit-Track
    ```

2. Create the local environment file:

    ```bash
    cp .env.dev.example .env.dev
    ```

3. Replace the example passwords and `JWT_SECRET` in `.env.dev`, then start the stack:

    ```bash
    docker compose --env-file .env.dev -f compose.dev.yaml up --build
    ```

4. Open the application at [http://localhost:5173](http://localhost:5173).

The frontend calls the API through the Vite proxy at `http://localhost:5173/api`. The backend remains available directly on `http://localhost:3001` for API development, and PostgreSQL is exposed only on `127.0.0.1:5433` by default. Database migrations run automatically before the API starts.

Stop the environment with:

```bash
docker compose --env-file .env.dev -f compose.dev.yaml down
```

To include pgAdmin, configure its values in `.env.dev` and start the `tools` profile:

```bash
docker compose --env-file .env.dev -f compose.dev.yaml --profile tools up --build
```

### Local development without Docker

Install all workspace dependencies:

```bash
npm ci
```

Create the application environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with a reachable PostgreSQL connection and a strong JWT secret. Apply the migrations from the repository root:

```bash
npm exec --workspace @fit-track/backend -- prisma migrate deploy
```

Run the API and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

The frontend always requests the relative `/api` path. Vite proxies it to `API_PROXY_TARGET` during local development; the default in `frontend/.env.example` targets the locally running backend.

## Available commands

Run these commands from the repository root:

| Command                      | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `npm run dev:backend`        | Start the API in watch mode                    |
| `npm run dev:frontend`       | Start the Vite development server              |
| `npm run dev:docker`         | Start the complete development stack           |
| `npm run dev:docker:debug`   | Start development with backend debugging       |
| `npm run dev:docker:down`    | Stop and remove the development stack          |
| `npm run build`              | Build all workspaces                           |
| `npm run lint`               | Lint all workspaces                            |
| `npm test`                   | Run all fast workspace tests                   |
| `npm run test:docker`        | Run verification in an isolated test stack     |
| `npm run typecheck`          | Type-check all workspaces                      |
| `npm run format`             | Format the repository with Prettier            |
| `npm run actions:lint`       | Statically check GitHub Actions workflows      |
| `npm run actions:list`       | List jobs that `act` can run locally           |
| `npm run actions:check`      | Lint workflows and dry-run the CI Verify job   |
| `npm run actions:verify`     | Simulate the CI Verify job with `act`          |
| `npm run check`              | Run lint, type-checking, and formatting checks |
| `npm run verify`             | Run fast tests, checks, and production builds  |
| `npm run verify:shared`      | Verify only the shared workspace               |
| `npm run verify:backend`     | Verify the backend and shared build            |
| `npm run verify:frontend`    | Verify the frontend and shared build           |
| `npm run verify:integration` | Run verification and backend integration tests |

## Security and production notes

The API includes HTTP security headers, credentialed CORS restricted to the configured client URL, request-size limits, rate limiting, Zod validation, CSRF origin checks for state-changing requests, and secure cookies in production.

The Dockerfiles contain optimized production stages, but `compose.dev.yaml` is intentionally a development environment. A real deployment still needs platform-specific configuration such as HTTPS termination, secret management, database backups, monitoring, health reporting, and a deployment pipeline.

Never commit `.env` files or real credentials. The committed example files contain development placeholders only.

## Testing GitHub Actions locally

Install Docker Desktop and the local workflow tools:

```bash
brew install act actionlint
```

From the repository root, statically validate workflows and inspect the jobs available to `act`:

```bash
npm run actions:lint
npm run actions:list
npm run actions:check
```

Simulate the CI `Verify` job locally:

```bash
npm run actions:verify
```

Use `npm run test:docker` rather than `act` for local backend integration tests. The dedicated Compose stack reproduces the temporary PostgreSQL database and migration lifecycle more reliably than GitHub service-container emulation.

The current local workflow simulation does not require repository variables or secrets. If a future workflow needs a secret, use `act -s SECRET_NAME` to enter it without placing its value in shell history. Local `.secrets`, `.vars`, and `.input` files remain ignored by Git and must never contain values intended for commit. The committed `.actrc` maps `ubuntu-latest` to act's medium Ubuntu image. `act` still only approximates GitHub-hosted runners, so confirm runner-specific behavior with a real GitHub Actions run before merging.

## Publishing container images

After CI succeeds on `main`, GitHub Actions publishes multi-platform (`linux/amd64` and `linux/arm64`) backend and frontend images to GHCR with the moving `main` tag and an immutable `sha-<commit>` tag. Each image includes an SBOM attestation describing its packaged components and a max-level provenance attestation describing how and from which revision it was built. Configure the repository variable `VITE_API_URL` as `/api` before enabling image publishing. Authentication uses the workflow-provided `GITHUB_TOKEN`; no separate registry secret is required.

Release Please manages FitTrack as one versioned product across all three workspaces. Configure a repository secret named `RELEASE_PLEASE_TOKEN` with a fine-grained personal access token scoped only to this repository. Grant it read/write access to contents, pull requests, and issues so Release Please-created pull requests, tags, and releases can trigger the existing workflows.

After a successful image build on `main`, Release Please creates or updates one release pull request from the Conventional Commits since the previous release:

- `fix:` proposes a patch release.
- `feat:` proposes a minor release.
- `feat!:` or a `BREAKING CHANGE` footer proposes a major release.

Review the generated version and `CHANGELOG.md`, wait for the release pull request checks, and squash-merge it. The merge runs CI and publishes immutable SHA images first. Release Please then creates the `vMAJOR.MINOR.PATCH` Git tag and GitHub Release, which triggers the image release workflow.

Do not create or push a release tag manually during the normal release process. Squash-merging the Release Please pull request is sufficient; after the build for that merge succeeds, Release Please publishes the tag and GitHub Release automatically.

To request a specific next version, add a `Release-As` footer to a Conventional Commit, for example:

```bash
git commit --allow-empty \
  -m "chore: prepare release 1.0.0" \
  -m "Release-As: 1.0.0"
git push origin main
```

The image release workflow validates the generated `vMAJOR.MINOR.PATCH` tag, its membership in `main`, and that it is the highest release version on `main`, then promotes the existing backend and frontend `sha-<commit>` images without rebuilding them. It adds the immutable version tag (`1.0.0`) and the moving `1.0`, `1`, and `latest` tags. Image promotion is a packaging step rather than an application deployment, so it does not target a GitHub environment. Add a protected production environment later when a CD workflow deploys the images to real infrastructure. Do not move or reuse an existing release tag; publish a new patch version instead.

## Quality checks

Before opening a pull request, run:

```bash
npm run verify
```

The test suite is split by responsibility:

- `shared` owns exhaustive input boundaries, normalization, common error and health responses, and domain response contracts.
- `frontend` uses jsdom, Testing Library, and MSW for user interactions, state transitions, error feedback, and accessibility smoke checks with axe-core. Its API client validates successful and error responses with shared Zod schemas.
- `backend` runs fast unit tests for isolated middleware, transaction retries, cookie options, and graceful shutdown. Its PostgreSQL integration tests use Vitest and Supertest for HTTP behavior, persistence, authentication, security middleware, ownership, nested-resource isolation, concurrency, and workout lifecycle rules. Integration tests validate real JSON responses with the same strict shared contracts used by the frontend.

`npm test` and `npm run verify` include backend unit tests but intentionally exclude the PostgreSQL integration suite. Run it through the isolated Docker stack whenever backend behavior, persistence, authorization, security middleware, or migrations change.

Run the complete isolated verification stack with:

```bash
npm run test:docker
```

The command builds a dedicated test image, starts PostgreSQL on a non-persistent `tmpfs`, applies all migrations, and runs `npm run verify:integration`. Stop and remove the test stack afterward with `npm run test:docker:down`. Run that cleanup command before retrying an interrupted stack when you need to verify the complete migration chain against a newly created database container.

## Author

Created by [Jakob Zagar](https://github.com/jakobzagar) as an independent portfolio project.
