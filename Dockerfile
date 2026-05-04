# syntax=docker/dockerfile:1.7

# Build the static export of apps/web with the full pnpm workspace,
# then serve out/ with nginx.

FROM node:20-alpine AS builder
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/controls/package.json ./packages/controls/
COPY packages/engine/package.json ./packages/engine/
COPY packages/shared/package.json ./packages/shared/
COPY packages/status-list/package.json ./packages/status-list/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY apps ./apps
COPY packages ./packages
COPY tools ./tools

RUN pnpm --filter @iwc/web build


FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

USER root
RUN rm -rf /usr/share/nginx/html/*
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/out /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

USER nginx
EXPOSE 8080
