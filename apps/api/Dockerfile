# Build context is the repo root (pnpm monorepo) — see docker-compose.prod.yml.

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---- deps: install full workspace (needed for pnpm workspace resolution) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# ---- build: compile the API ----
FROM deps AS build
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @franjah/api run build

# ---- runtime: slim image with only what's needed to run ----
FROM node:20-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod --filter @franjah/api...

COPY --from=build /repo/apps/api/dist apps/api/dist
COPY --from=build /repo/packages/shared packages/shared

WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main"]
