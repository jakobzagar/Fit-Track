FROM node:25.9.0-alpine3.23 AS base

WORKDIR /user/src/app

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci \
    --workspace @fit-track/backend \
    --workspace @fit-track/shared \
    --include-workspace-root


FROM dependencies AS build

COPY shared ./shared
COPY backend ./backend

RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused \
    npm run build:backend


FROM build AS migration

WORKDIR /user/src/app/backend

USER node

CMD ["npm", "exec", "--", "prisma", "migrate", "deploy"]


FROM base AS production-dependencies

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci --omit=dev --omit=optional \
    --workspace @fit-track/backend \
    --workspace @fit-track/shared \
    --include-workspace-root


FROM dependencies AS development

COPY shared ./shared

RUN npm run build:shared

COPY --chown=node:node backend ./backend

RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused \
    npm run generate --workspace @fit-track/backend \
    && chown -R node:node ./backend/generated

EXPOSE 3001

USER node

HEALTHCHECK \
    --interval=10s \
    --timeout=5s \
    --start-period=10s \
    --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3001/api/health/ready').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["npm", "run", "dev", "--workspace", "@fit-track/backend"]


FROM base AS production

LABEL org.opencontainers.image.source="https://github.com/jakobzagar/Fit-Track"

ENV NODE_ENV=production

COPY --from=production-dependencies /user/src/app/package.json ./package.json
COPY --from=production-dependencies /user/src/app/node_modules ./node_modules

COPY --from=build /user/src/app/shared/package.json ./shared/package.json
COPY --from=build /user/src/app/shared/dist ./shared/dist

COPY --from=build /user/src/app/backend/package.json ./backend/package.json
COPY --from=build /user/src/app/backend/dist ./backend/dist
COPY --from=build /user/src/app/backend/generated ./backend/generated

WORKDIR /user/src/app/backend

EXPOSE 3001

USER node

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=10s \
    --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3001/api/health/live').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/src/server.js"]
