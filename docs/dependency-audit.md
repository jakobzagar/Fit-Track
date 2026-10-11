# Dependency policy

This file records the supported dependency lines and update rules for the monorepo. Runtime responsibilities belong in the [architecture guide](architecture.md), and validation commands belong in the [testing guide](testing.md).

The manifests define supported ranges; committed lockfiles record resolved npm versions. Image references are maintained in Dockerfiles, Compose files, and CI rather than duplicated here.

## Supported versions

| Dependency          | Supported line  | Used for                                      |
| ------------------- | --------------- | --------------------------------------------- |
| Node.js             | `>=24.21.0 <25` | Local tooling, CI, builds, and runtime images |
| npm                 | `11.x`          | Workspace package management                  |
| Prisma packages     | `7.10.0`        | Client, PostgreSQL adapter, CLI, migrations   |
| TypeScript          | `6.0.x`         | All workspaces                                |
| React and React DOM | `19.3.0`        | Frontend runtime                              |
| Zod                 | `4.6.x`         | Shared and application contracts              |
| ESLint              | `10.x`          | Static analysis                               |
| typescript-eslint   | `8.x`           | TypeScript lint integration                   |
| Vite                | `8.x`           | Frontend build and development                |
| Tailwind CSS        | `4.x`           | Frontend styling and Vite integration         |
| Vitest              | `5.x`           | Fast unit and component tests                 |
| MSW                 | `3.x`           | Frontend HTTP-boundary mocks                  |
| Playwright          | `1.x`           | Browser end-to-end tests                      |
| PostgreSQL          | `17.x`          | Application and integration-test database     |

## Update rules

- Keep `prisma`, `@prisma/client`, and `@prisma/adapter-pg` on the same exact version across the backend and migration runtime.
- Keep `dotenv` aligned between the backend and migration runtime.
- Keep `react` and `react-dom` on the same exact version; keep their type packages on the matching React minor line.
- Keep `@types/node` on the supported Node.js major line.
- Update Zod and shared TypeScript tooling across all owning workspaces together.
- Keep `tailwindcss` and `@tailwindcss/vite` in frontend `devDependencies` and update them together.
- When a dependency with an install script changes, update the corresponding `allowScripts` entry to the resolved lockfile version.
- Minor and patch updates are allowed after the required checks pass. Review major updates in a dedicated pull request with migration notes where needed.
- Do not hide a vulnerable transitive dependency with a forced downgrade or override unless the replacement is supported and verified.
- Regenerate and commit every lockfile affected by a manifest change.
- Pin database and local-tool images to an explicit version and multi-platform index digest. When updating an image, verify its upstream tag and digest, change both together across every Compose file and CI service that uses it, and run the affected container checks. The PostgreSQL image is for local and test databases; pgAdmin is an optional local tool. Docker Hub lists the [PostgreSQL](https://hub.docker.com/_/postgres/tags) and [pgAdmin](https://hub.docker.com/r/dpage/pgadmin4/tags) image releases.

Dependabot checks Dockerfiles, root Docker Compose files, GitHub Actions, the root npm workspace, and the standalone migration-runtime package weekly. Review image tag and digest changes together in its pull requests. Its pull requests use the same protected-branch checks as other changes and are not merged automatically.

## Audit scope and remaining Prisma CLI findings

Audit both lockfiles: `npm audit` at the repository root and `npm audit --prefix backend/migration-runtime`. For the backend image, match its install settings with `npm audit --omit=dev --omit=optional --workspace @fit-track/backend --workspace @fit-track/shared --include-workspace-root`. Omitting only development dependencies can still report the optional Prisma CLI peer dependency. Neither production-only audit covers the migration image: that image intentionally installs and runs the Prisma CLI from the migration runtime's development dependencies.

Prisma `7.10.0` pins `mysql2` to `3.15.3` and `@prisma/config` pins `deepmerge-ts` to `7.1.5`. npm audit reports MySQL authentication/compression and recursive-merge advisories in this CLI dependency chain. FitTrack uses PostgreSQL and a repository-owned Prisma configuration; those findings remain dependency risks, without establishing exposure through the Express API. The backend production image omits the Prisma CLI; the migration image includes it.

Keep these findings visible until a compatible upstream release resolves them. The audit-suggested Prisma `6.19.3` downgrade conflicts with the supported Prisma line. Do not force that downgrade or override pinned CLI dependencies to obtain a clean audit. Deploying an updated backend also requires rebuilding and releasing its image; changing a lockfile does not patch an already running ECS task.
