# FitTrack

![FitTrack](frontend/public/brand/fittrack-logo-dark.png)

[![Test](https://github.com/jakobzagar/Fit-Track/actions/workflows/test.yaml/badge.svg)](https://github.com/jakobzagar/Fit-Track/actions/workflows/test.yaml)

FitTrack is a backend- and delivery-focused TypeScript system for planning and recording workouts. It demonstrates relational data modelling, authorization, transactional lifecycle invariants, PostgreSQL integration testing, containerized delivery, and release automation. A React application serves as the reference client for the complete API workflow.

> **Hosted architecture:** [FitTrack on AWS](https://d3avuxvegd3iy8.cloudfront.net) uses CloudFront, private S3, ECS Fargate, ECR, and private Single-AZ RDS. Nine CloudFormation stacks define the deployment; GitHub Actions verifies and publishes container artifacts. See [AWS deployment](docs/aws-deployment.md) for architecture and operational limits.

## What this project demonstrates

| Focus                | Evidence                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Backend design       | Thin Express routes, authoritative domain services, centralized middleware, and Prisma persistence                           |
| Data integrity       | Ownership-scoped queries, relational constraints, append-only migrations, serializable transactions, and retry handling      |
| Security             | HTTP-only cookies, CSRF origin checks, credentialed CORS, payload limits, rate limiting, security headers, and log redaction |
| Verification         | Contract, unit, PostgreSQL integration, concurrency, browser E2E, accessibility, release-tool, and final-container tests     |
| Container delivery   | Non-root multi-stage images, a dedicated migration artifact, digest-pinned smoke tests, SBOM, and build provenance           |
| Release engineering  | Protected pull requests, coordinated product versions, exact-digest promotion, and Release Please                            |
| Cloud infrastructure | Deployed private Fargate/RDS architecture, CloudFront/S3 delivery, scoped IAM, VPC endpoints, and nine CloudFormation stacks |
| Reference client     | A React interface that exercises authentication, lifecycle transitions, validation failures, and persisted state             |

### Recommended technical review path

1. Read the [workout lifecycle and data model](docs/architecture.md#workout-lifecycle).
2. Inspect the [lifecycle service](backend/src/modules/workouts/services/workout-lifecycle.service.ts) and its [concurrency tests](backend/src/modules/workouts/tests/workout-lifecycle-concurrency.integration.test.ts).
3. Review [nested ownership enforcement](backend/src/modules/workouts/workout-exercises/services/owned-workout-resource.loader.ts) and the [authorization integration tests](backend/src/modules/workouts/workout-exercises/tests/workout-exercise.integration.test.ts).
4. Follow the [risk-to-evidence testing map](docs/testing.md#risk-to-evidence-map).
5. Review the [container and release pipeline](docs/release-process.md#pipeline-overview).
6. Review the [hosted AWS architecture](docs/aws-deployment.md#architecture-overview) and its [accepted limits](docs/aws-deployment.md#accepted-limits-and-deployment-portability).

## Engineering case studies

### Enforcing one active workout

**Problem:** two concurrent requests could otherwise start different workouts for the same user.

**Decision:** lifecycle transitions run in serializable transactions, while a partial PostgreSQL unique index provides the final persistence-level invariant. The service translates the expected uniqueness race into stable domain behavior.

**Evidence:** [lifecycle implementation](backend/src/modules/workouts/services/workout-lifecycle.service.ts), [database migration](backend/prisma/migrations/20260815000000_enforce_one_active_workout_per_user/migration.sql), and [concurrency regression tests](backend/src/modules/workouts/tests/workout-lifecycle-concurrency.integration.test.ts).

### Protecting nested workout resources

**Problem:** knowing a valid set or workout-exercise ID must not allow access through a different workout or by another user.

**Decision:** every protected nested mutation resolves the complete ownership chain before changing data. PostgreSQL relations and cascades complement, rather than replace, application authorization.

**Evidence:** [owned-resource loader](backend/src/modules/workouts/workout-exercises/services/owned-workout-resource.loader.ts) and [nested mutation tests](backend/src/modules/workouts/workout-exercises/tests/workout-mutation-constraints.integration.test.ts).

### Verifying the artifact that is promoted

**Problem:** a human-readable image tag can move and therefore cannot prove which content passed runtime verification.

**Decision:** workflows smoke-test the exact digests returned by each build and promote those same digests. A separate migration image makes schema rollout an explicit deployment step.

**Evidence:** [production image action](.github/actions/build-production-images/action.yml), [container smoke script](scripts/smoke/production-containers.sh), and [release policy](docs/release-process.md#published-images).

## Product behavior

Users can register, maintain a personal exercise library, create ordered workouts, record sets, compare previous performance, and correct completed records through an explicit lifecycle.

```mermaid
stateDiagram-v2
    state "Draft workout" as Draft
    state "Active workout" as Active
    state "Completed record" as Completed

    [*] --> Draft: Create
    Draft --> Active: Start
    Active --> Draft: Cancel
    Active --> Completed: Finish
    Completed --> Active: Reopen
```

A user can have only one active workout. Cancellation preserves entered set values but clears completion marks. Each workout exercise preserves the exercise name, muscle group, and equipment from when it was added, so later library edits do not rewrite workout history. Reopening preserves a completed record while making the correction deliberate. Any owned workout can be deleted together with its nested exercises and sets.

## System overview

```mermaid
flowchart LR
    User([User]) --> Client[React reference client]
    Client -->|/api| Backend[Express backend]
    Backend --> Database[(PostgreSQL)]

    Contracts[Shared Zod contracts] -.-> Client
    Contracts -.-> Backend
```

| Area             | Technologies                                                  |
| ---------------- | ------------------------------------------------------------- |
| Backend          | Node.js 24, Express 5, TypeScript, Prisma ORM, Zod, Pino      |
| Database         | PostgreSQL 17                                                 |
| Delivery         | Docker Compose, GitHub Actions, GHCR, Release Please          |
| Testing          | Vitest, Supertest, Playwright, Testing Library, MSW, axe-core |
| Reference client | React 19, Vite, React Router, Tailwind CSS                    |
| Shared contracts | Framework-independent Zod schemas and inferred types          |

The backend is the authoritative trust boundary. Shared contracts keep HTTP request and response shapes aligned, while PostgreSQL constraints protect invariants that must survive concurrent requests. See [Architecture and design decisions](docs/architecture.md) for request flow, module ownership, security controls, runtime behavior, and accepted trade-offs.

## Run locally

### Requirements

- Docker with Docker Compose
- Node.js `>=24.21.0 <25` and npm `11.x` for the repository commands
- Git

```bash
git clone https://github.com/jakobzagar/Fit-Track.git
cd Fit-Track
cp .env.dev.example .env.dev
```

Replace the example passwords and `JWT_SECRET`, then start the complete stack:

```bash
npm run dev:docker
```

| Process    | Address                                        |
| ---------- | ---------------------------------------------- |
| Frontend   | [http://localhost:5173](http://localhost:5173) |
| Backend    | [http://localhost:3001](http://localhost:3001) |
| PostgreSQL | `127.0.0.1:5433`                               |

The one-off migration container must succeed before the backend starts. Stop the stack without deleting its database volume with `npm run dev:docker:down`. Direct-process setup and environment ownership are documented in [architecture](docs/architecture.md#environment-configuration).

## Verification

```bash
npm run verify      # lint, types, formatting, fast and release-tool tests, builds
npm run test:docker # migrated PostgreSQL integration and concurrency tests
npm run test:e2e    # critical browser journeys against the real backend and database
```

Pull requests additionally build and exercise the final backend, migration, and Nginx images together. The complete responsibility map, safety guards, and diagnostic commands belong in the [testing strategy](docs/testing.md).

## Current operational limits

- Backend tasks and RDS use Single-AZ placement; the two-AZ ALB does not provide workload or database failover.
- Viewer HTTPS terminates at CloudFront; the API origin path to ALB and backend uses HTTP.
- Rate-limit counters are process-local. Service Auto Scaling, WAF, metrics alarms, and distributed tracing are not configured.
- AWS deployments and frontend uploads are manual; GitHub Actions publishes GHCR artifacts without performing AWS rollout.
- RDS backups and seven-day CloudWatch log retention are configured; backup restore procedures have not been exercised.

Architecture, runtime verification, and remaining configuration drift are documented in [AWS deployment](docs/aws-deployment.md).

## Documentation

- [Domain language](CONTEXT.md)
- [Architecture and design decisions](docs/architecture.md)
- [Testing strategy](docs/testing.md)
- [Dependency policy](docs/dependency-audit.md)
- [Release and container process](docs/release-process.md)
- [AWS deployment](docs/aws-deployment.md)
- [EC2 / Multi-AZ infrastructure](infra/ec2-multi-az/README.md)
- [Fargate / Single-AZ infrastructure](infra/fargate-single-az/README.md)

## Author

Designed and implemented by [Jakob Zagar](https://github.com/jakobzagar) as an independent backend, delivery, and cloud-learning portfolio project.
