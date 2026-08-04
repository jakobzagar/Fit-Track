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
├── shared/            Shared Zod schemas and TypeScript contracts
└── compose.dev.yaml   Local containerized development stack
```

The repository uses npm workspaces. The frontend and backend consume `@fit-track/shared`, keeping validation rules and API contracts consistent across application boundaries. Backend features follow a route → controller → service structure, while frontend code is organized by feature.

## Getting started

### Prerequisites

- Docker with Docker Compose
- Alternatively, Node.js 24+, npm 11+, and PostgreSQL

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

The API is available at `http://localhost:3001/api`. PostgreSQL is exposed only on `127.0.0.1:5433` by default. Database migrations run automatically before the API starts.

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
| `npm test`                   | Run fast shared and frontend tests             |
| `npm run test:docker`        | Run verification in an isolated test stack     |
| `npm run typecheck`          | Type-check all workspaces                      |
| `npm run format`             | Format the repository with Prettier            |
| `npm run actions:lint`       | Statically check GitHub Actions workflows      |
| `npm run actions:list`       | List jobs that `act` can run locally           |
| `npm run actions:check`      | Lint and dry-run GitHub Actions locally        |
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
```

Run all jobs for the default event, or select a single job by its workflow job ID:

```bash
act
act -j <job-id>
```

Use `act -s SECRET_NAME` to enter a secret without placing its value in shell history. Local `.secrets`, `.vars`, and `.input` files are ignored by Git and must never contain values intended for commit. `act` approximates GitHub-hosted runners with Docker, so confirm runner-specific behavior with a real GitHub Actions run before merging.

## Quality checks

Before opening a pull request, run:

```bash
npm run verify
```

The test suite is split by responsibility:

- `shared` owns exhaustive schema boundaries, normalization, and API contract values.
- `frontend` uses jsdom, Testing Library, and MSW for user interactions, state transitions, error feedback, and accessibility smoke checks with axe-core.
- `backend` uses Vitest, Supertest, and PostgreSQL for HTTP behavior, persistence, authentication, CSRF, ownership, nested-resource isolation, and workout lifecycle rules.

`npm test` and `npm run verify` intentionally exclude the PostgreSQL integration suite. Run it through the isolated Docker stack whenever backend behavior, persistence, authorization, or migrations change.

Run the complete isolated verification stack with:

```bash
npm run test:docker
```

The command builds a dedicated test image, starts a temporary PostgreSQL database, applies all migrations, and runs `npm run verify:integration`. Stop and remove the test stack afterward with `npm run test:docker:down`.

## Author

Created by [Jakob Zagar](https://github.com/jakobzagar) as an independent portfolio project.
