FROM node:24.13.0-alpine3.23

WORKDIR /user/src/app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci

COPY shared ./shared
COPY backend ./backend

RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused npm run build:backend
RUN npm prune --omit=dev

ENV NODE_ENV=production

WORKDIR /user/src/app/backend

EXPOSE 3001

USER node

CMD ["node", "dist/src/server.js"]
