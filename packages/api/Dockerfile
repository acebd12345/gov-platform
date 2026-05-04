# syntax=docker/dockerfile:1.7

# ===== Stage 1: deps =====
# Install full dependencies including devDeps (we run tsx in prod).
# Build at the monorepo root so npm workspaces resolves correctly.
FROM node:20-alpine AS deps

WORKDIR /app

# Copy lockfile + root manifest first for cache reuse.
COPY package.json package-lock.json* ./

# Copy package manifests for every workspace (needed for npm ci to plan installs).
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json     packages/db/
COPY packages/api/package.json    packages/api/
COPY packages/admin/package.json  packages/admin/

# Use npm ci against the root lockfile so versions match exactly.
RUN npm ci --workspaces --include-workspace-root --no-audit --no-fund

# ===== Stage 2: runtime =====
FROM node:20-alpine AS runtime

# tini gives us proper PID 1 + signal forwarding for graceful shutdown.
RUN apk add --no-cache tini curl \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=4000

# Copy installed node_modules (incl. workspace symlinks) and source.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY tsconfig.json ./

# Workspace package source — keep as TypeScript; tsx transpiles on import.
COPY packages/shared ./packages/shared
COPY packages/db     ./packages/db
COPY packages/api    ./packages/api

# Make sure workspace symlinks survived the COPY (they should, but verify).
RUN ls -la node_modules/@gov || true

# Fix ownership and switch to non-root.
RUN chown -R app:app /app
USER app

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT}/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# tsx runs TypeScript directly — avoids needing a per-package build step
# while still being substantially faster than ts-node.
CMD ["node", "--enable-source-maps", "node_modules/.bin/tsx", "packages/api/src/index.ts"]
