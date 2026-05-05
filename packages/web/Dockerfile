# syntax=docker/dockerfile:1.7

# ===== Stage 1: deps =====
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json     packages/db/
COPY packages/api/package.json    packages/api/
COPY packages/admin/package.json  packages/admin/
COPY packages/ui/package.json     packages/ui/
COPY packages/web/package.json    packages/web/

RUN rm -f package-lock.json && npm cache clean --force && npm install --workspaces --include-workspace-root --no-audit --no-fund --force

# ===== Stage 2: build =====
FROM node:20-alpine AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY tsconfig.json ./

# web 依賴 @gov/shared 與 @gov/ui，必須在 build 期一併帶進來
COPY packages/shared ./packages/shared
COPY packages/ui     ./packages/ui
COPY packages/web    ./packages/web

# Build-time NEXT_PUBLIC_* / API_BASE_URL — baked into the bundle
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
ARG API_BASE_URL=
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV API_BASE_URL=${API_BASE_URL}

RUN npm run build --workspace=packages/web

# ===== Stage 3: runtime =====
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini curl \
    && addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3002 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=build --chown=app:app /app/packages/web/.next/standalone ./
COPY --from=build --chown=app:app /app/packages/web/.next/static     ./packages/web/.next/static
COPY --from=build --chown=app:app /app/packages/web/public           ./packages/web/public

USER app

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT}/ || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "packages/web/server.js"]
