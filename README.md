# FitTrack

![FitTrack](frontend/public/brand/fittrack-logo.png)

FitTrack is a full-stack workout planning and tracking application. It provides a focused space to create an exercise library, build workouts, run training sessions, and record completed sets.

This repository is a portfolio project built to demonstrate production-oriented full-stack development: a typed monorepo, shared validation contracts, authenticated REST APIs, relational data modelling, database migrations, containerized environments, and defensive backend defaults.

> **Project status:** actively developed. The core workout workflow is functional; automated test coverage and a hosted demo are planned.

## Features

- Account registration, login, logout, and session restoration
- Per-user exercise library with archive and restore support
- Workout creation, editing, deletion, and lifecycle states
- Exercises and ordered sets within a workout
- Reps, weight, duration, notes, and set completion tracking
- Previous-performance context during workout sessions
- Responsive protected application routes and public landing page

## Tech stack

| Area           | Technologies                                                |
| -------------- | ----------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, React Router, Tailwind CSS, Zod |
| Backend        | Node.js 24, Express 5, TypeScript, Prisma ORM, Zod          |
| Database       | PostgreSQL 17                                               |
| Authentication | JWT in HTTP-only cookies, bcrypt password hashing           |
| Tooling        | npm workspaces, ESLint, Prettier, Docker, Docker Compose    |

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

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `npm run dev:backend`  | Start the API in watch mode                    |
| `npm run dev:frontend` | Start the Vite development server              |
| `npm run build`        | Build all workspaces                           |
| `npm run lint`         | Lint all workspaces                            |
| `npm run typecheck`    | Type-check all workspaces                      |
| `npm run format`       | Format the repository with Prettier            |
| `npm run check`        | Run lint, type-checking, and formatting checks |
| `npm run verify`       | Run all checks and a production build          |

## Security and production notes

The API includes HTTP security headers, credentialed CORS restricted to the configured client URL, request-size limits, rate limiting, Zod validation, CSRF origin checks for state-changing requests, and secure cookies in production.

The Dockerfiles contain optimized production stages, but `compose.dev.yaml` is intentionally a development environment. A real deployment still needs platform-specific configuration such as HTTPS termination, secret management, database backups, monitoring, health reporting, and a deployment pipeline.

Never commit `.env` files or real credentials. The committed example files contain development placeholders only.

## Quality checks

Before opening a pull request, run:

```bash
npm run verify
```

Automated application tests have not yet been added. This is a known project improvement area and is not hidden behind a misleading coverage claim.

## Roadmap

- Automated unit and integration tests
- Continuous integration with GitHub Actions
- Hosted demo environment
- Training insights and progress visualizations
- Improved observability and operational health checks

## Contributing

Issues and focused pull requests are welcome. Keep changes focused, follow the existing project structure, and run `npm run verify` before opening a pull request.

## Author

Created by [Jakob Zagar](https://github.com/jakobzagar) as an independent portfolio project.
