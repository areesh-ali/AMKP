# syntax=docker/dockerfile:1
# AMKP plane runtime — api + worker (+ prisma migrate)
FROM node:24.18-bookworm-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate \
  && apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/worker/package.json apps/worker/
COPY apps/console/package.json apps/console/
COPY apps/reference-multi-product/package.json apps/reference-multi-product/
COPY packages/domain/package.json packages/domain/
COPY packages/application/package.json packages/application/
COPY packages/adapters-postgres/package.json packages/adapters-postgres/
COPY packages/adapters-redis/package.json packages/adapters-redis/
COPY packages/adapters-providers/package.json packages/adapters-providers/
COPY packages/sdk-js/package.json packages/sdk-js/
COPY packages/openapi/package.json packages/openapi/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @amkp/domain build \
  && pnpm --filter @amkp/application build \
  && pnpm --filter @amkp/adapters-redis build \
  && pnpm --filter @amkp/adapters-postgres build \
  && pnpm --filter @amkp/adapters-providers build \
  && pnpm --filter @amkp/sdk-js build \
  && pnpm --filter @amkp/api build \
  && pnpm --filter @amkp/worker build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app
# Default overridden by compose
CMD ["pnpm", "--filter", "@amkp/api", "start"]
