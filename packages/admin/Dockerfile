# syntax=docker/dockerfile:1.7

# ===== Stage 1: deps =====
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json     packages/db/
COPY packages/api/package.json    packages/api/
COPY packages/admin/package.json  packages/admin/

RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund

# ===== Stage 2: build =====
FROM node:20-alpine AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY tsconfig.json ./

# Source for the admin build (admin imports @gov/shared at compile time).
COPY packages/shared ./packages/shared
COPY packages/admin  ./packages/admin

# Build NEXT_PUBLIC_* env vars are baked into the bundle, so accept them here.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build --workspace=packages/admin

# ===== Stage 3: runtime =====
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini curl \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3001 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# Next.js standalone output: this directory contains a minimal server.js
# plus only the node_modules actually needed at runtime.
COPY --from=build --chown=app:app /app/packages/admin/.next/standalone ./
COPY --from=build --chown=app:app /app/packages/admin/.next/static     ./packages/admin/.next/static
COPY --from=build --chown=app:app /app/packages/admin/public           ./packages/admin/public

USER app

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT}/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# Standalone server entrypoint lives at <traceRoot>/packages/admin/server.js
CMD ["node", "packages/admin/server.js"]
