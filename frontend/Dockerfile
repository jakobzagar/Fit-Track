FROM node:26.8.1-alpine3.23 AS base

WORKDIR /user/src/app

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci \
    --workspace @fit-track/frontend \
    --workspace @fit-track/shared \
    --include-workspace-root


FROM dependencies AS development

COPY shared ./shared
RUN npm run build:shared

COPY --chown=node:node frontend ./frontend

RUN chown -R node:node ./frontend

WORKDIR /user/src/app/frontend

EXPOSE 5173

USER node

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


FROM dependencies AS build

COPY shared ./shared
COPY frontend ./frontend

ARG VITE_API_BASE_PATH=/api
ENV VITE_API_BASE_PATH=$VITE_API_BASE_PATH

RUN npm run build:frontend


FROM nginxinc/nginx-unprivileged:alpine AS production

LABEL org.opencontainers.image.source="https://github.com/jakobzagar/Fit-Track"

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/nginx-security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /user/src/app/frontend/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=5s \
    --retries=3 \
    CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/health"]

CMD ["nginx", "-g", "daemon off;"]
