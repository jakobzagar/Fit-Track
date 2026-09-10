# Dependency policy

This file records the supported dependency lines and update rules for the monorepo. Runtime responsibilities belong in the [architecture guide](architecture.md), and validation commands belong in the [testing guide](testing.md).

## Supported versions

| Dependency          | Supported line  | Used for                                      |
| ------------------- | --------------- | --------------------------------------------- |
| Node.js             | `>=24.21.0 <25` | Local tooling, CI, builds, and runtime images |
| npm                 | `11.x`          | Workspace package management                  |
| Prisma packages     | `7.10.0`        | Client, PostgreSQL adapter, CLI, migrations   |
| TypeScript          | `6.0.x`         | All workspaces                                |
| React and React DOM | `19.2.8`        | Frontend runtime                              |
| Zod                 | `4.6.x`         | Shared and application contracts              |
| ESLint              | `10.x`          | Static analysis                               |
| typescript-eslint   | `8.x`           | TypeScript lint integration                   |
| Vite                | `8.x`           | Frontend build and development                |
| Tailwind CSS        | `4.x`           | Frontend styling and Vite integration         |
| Vitest              | `5.x`           | Fast unit and component tests                 |
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

Dependabot checks GitHub Actions, the root npm workspace, and the standalone migration-runtime package weekly. Its pull requests use the same protected-branch checks as other changes and are not merged automatically.
