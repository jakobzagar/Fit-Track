# Testing strategy

FitTrack separates tests by responsibility so failures point to the correct boundary. The suite uses Vitest throughout, Testing Library and MSW in the frontend, and Supertest with PostgreSQL in backend integration tests.

## Test layers

| Layer               | Location                                  | Primary responsibility                                                      |
| ------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Shared contract     | Beside schemas as `*.test.ts`             | Validation matrices, normalization, strict request and response shapes      |
| Backend unit        | Beside the owning area as `*.test.ts`     | Middleware, cookie options, transaction retry, graceful shutdown            |
| Backend integration | Owning modules as `*.integration.test.ts` | HTTP, PostgreSQL, ownership, nested resources, lifecycle, concurrency       |
| Frontend            | Feature or component `tests/` directories | User interaction, error feedback, routing, accessibility, state transitions |

## Fast verification

```bash
npm run verify
```

This command runs linting, type checking, formatting checks, fast workspace tests, and production builds. It intentionally excludes PostgreSQL integration tests.

Useful narrower commands are:

| Command                   | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `npm test`                | Run all fast workspace tests                   |
| `npm run check`           | Run lint, type checking, and formatting checks |
| `npm run verify:shared`   | Verify the shared package                      |
| `npm run verify:backend`  | Verify backend compilation and static checks   |
| `npm run verify:frontend` | Verify frontend checks, tests, and build       |

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

## Regression policy

Observable behavior changes require tests at the layer that owns the behavior. Bug fixes add a regression case that reproduces the failure. Refactors should preserve existing expectations rather than weakening assertions to make tests pass.

When backend persistence, authorization, security middleware, concurrency, or migrations change, both `npm run verify` and `npm run test:docker` are required before handoff.
