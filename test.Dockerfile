FROM node:26.8.1-alpine3.23

WORKDIR /user/src/app

COPY package.json package-lock.json ./
COPY .prettierrc.json .prettierignore ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci

COPY shared ./shared
COPY backend ./backend
COPY frontend ./frontend

RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused \
    npm run generate --workspace @fit-track/backend \
    && chown -R node:node /user/src/app

USER node

CMD ["npm", "run", "verify:integration"]
