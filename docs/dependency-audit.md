# Dependency audit

**Audit date:** 2026-09-09  
**Scope:** all npm manifests and lockfiles, direct and important transitive
dependencies, peer constraints, security advisories, install scripts, CI, and
container toolchains.

This document records the point-in-time dependency decisions made by the audit. It
does not redefine the project structure or runtime design; those belong in
[architecture.md](architecture.md). Test commands and CI responsibilities remain in
[testing.md](testing.md).

## Conclusion

The workspace and its separate migration lockfile are internally consistent. Both
lockfiles use npm lockfile version 3, contain integrity hashes for registry
artifacts, and contain no deprecated packages or unexpected Git/HTTP sources.
`npm ls --all` reports no invalid or missing required dependency.

The selected stability baseline is Node 24 LTS, npm 11, Prisma 7.10, TypeScript
6.0.3, React 19.2, ESLint 10, Vite 8, and Vitest 5.

## Decisions

| Area              | Decision                                                                                        | Reason                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Node              | Use 24.21.x and reject other Node majors                                                        | Aligns local development, CI, and containers on the supported LTS line                                      |
| npm               | Accept npm 11; use the version bundled with the official Node distribution in CI and containers | Avoids a redundant global npm installation and duplicated patch pin                                         |
| Prisma            | Keep and exact-pin CLI, client, and PostgreSQL adapter at 7.10.0                                | Prisma 8 is still an RC; downgrading to Prisma 6 is not an appropriate advisory fix                         |
| TypeScript        | Keep `~6.0.3`                                                                                   | `typescript-eslint` supports TypeScript below 6.1; TypeScript 7 is not yet a normal replacement             |
| React             | Keep React and React DOM at 19.2.8 with matching 19.2 types                                     | npm exposes 19.3, but the official React documentation still identifies 19.2 as its documented stable line  |
| Zod               | Align all owning workspaces on `^4.6.0`                                                         | Shared contracts require a coordinated version range                                                        |
| Node types        | Use `^24.13.4` in backend and frontend                                                          | Matches the selected Node 24 application target                                                             |
| TypeScript ESLint | Use `^8.70.0` in all owning workspaces                                                          | Current compatible stable release                                                                           |
| Tailwind          | Keep `tailwindcss` and `@tailwindcss/vite` in frontend `devDependencies`                        | They are build-time inputs and are not shipped in the Nginx runtime image                                   |
| Install scripts   | Record version-specific `allowScripts` entries                                                  | Makes the reviewed script-bearing packages visible without disabling scripts required by Prisma and esbuild |

Prisma versions are also checked by the release-artifact validator so the CLI,
client, adapter, and migration runtime cannot drift independently.

## Security finding

The production-only dependency graph has **0 known vulnerabilities**. The complete
root graph and the migration-runtime graph each report **4 high-severity findings**
through the Prisma CLI:

- `deepmerge-ts`: recursive merge stack exhaustion
  ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx));
- `mysql2`: clear-password authentication downgrade
  ([GHSA-3f6p-5ww8-9rcr](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr));
- `mysql2`: compressed-protocol decompression denial of service
  ([GHSA-rgwj-5xj2-c3m3](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3)).

These are migration-tool findings, not backend runtime dependencies, but they are
still deployment-relevant because the migration image executes Prisma CLI. Current
exposure is reduced because FitTrack uses PostgreSQL rather than MySQL, migration
configuration is repository-controlled, and the migration process is short-lived.

`npm audit fix --force` is not suitable: it proposes Prisma 6.19.3, which is a
breaking downgrade. Transitive overrides are also deferred until Prisma publishes
compatible updates. Recheck these advisories on every Prisma patch update.

## Implemented changes

- aligned Node 24.21.0 across manifests, Docker, and CI;
- accepted npm 11 and removed redundant global npm installation from Docker and CI;
- updated `@types/node`, `typescript-eslint`, Zod, and Tailwind build packages;
- retained React 19.2.8 and TypeScript 6.0.3;
- exact-pinned and regression-tested Prisma version alignment;
- regenerated both lockfiles;
- documented lasting rules in the owning architecture and testing documents.

## Validation

- formatting, linting, type checking, 314 fast tests, and all builds passed;
- release-artifact validation and its Prisma mismatch regression cases passed;
- all migrations and 113 backend integration tests passed against isolated
  PostgreSQL;
- backend, migration, and frontend production images built successfully;
- production-container health, proxy, security-header, and cache-header smoke checks
  passed;
- `npm ls --all` passed;
- production-only audit reported 0 vulnerabilities;
- full and migration-runtime audits reproduced the 4 Prisma CLI findings;
- npm reported no unreviewed install scripts.

Browser E2E and the complete Ubuntu verification suite remain required pull-request
checks before merge.

## Primary compatibility references

- [Prisma documentation](https://www.prisma.io/docs)
- [typescript-eslint supported dependency versions](https://typescript-eslint.io/users/dependency-versions/)
- [React versions](https://react.dev/versions)
- [npm package manifest documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/)
- [Node.js releases](https://nodejs.org/en/blog/release)
