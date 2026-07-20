FROM node:24.13.0-alpine3.23 AS build

WORKDIR /user/src/app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci

COPY shared ./shared
COPY backend ./backend

RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused npm run build:backend


FROM build AS migration

WORKDIR /user/src/app/backend

USER node

CMD ["npx", "prisma", "migrate", "deploy"]


FROM build AS production-dependencies

RUN npm prune --omit=dev


FROM node:24.13.0-alpine3.23 AS runtime

WORKDIR /user/src/app

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

CMD ["node", "dist/src/server.js"]
