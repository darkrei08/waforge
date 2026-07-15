# ─── Build Stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl and copy bun binary for superfast package installation
RUN apk add --no-cache openssl bash
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

# Copy root lockfiles
COPY package.json bun.lock ./

# Copy monorepo packages
COPY apps/dashboard/package.json apps/dashboard/
COPY services/core-api/package.json services/core-api/
COPY apps/frontend/package.json apps/frontend/
COPY packages/database/package.json packages/database/

RUN bun install --ignore-scripts

COPY . .

WORKDIR /app/packages/database
RUN npx prisma generate

WORKDIR /app/apps/dashboard
RUN bun run postinstall || true
# Run nuxt build via Node to prevent Bun fs async I/O race condition (ENOENT on rollup server bundles)
RUN npx nuxt build

# ─── Production Stage ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl so Prisma can detect OpenSSL 3.x correctly instead of defaulting to 1.1.x
RUN apk add --no-cache openssl su-exec

RUN addgroup --system --gid 1001 nuxtjs && \
    adduser --system --uid 1001 nuxtjs

# Copy Nitro server output
COPY --from=builder /app/apps/dashboard/.output ./.output

# Copy entire hoisted node_modules and database package for Prisma client
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/database /app/packages/database

# We still need the prisma schema for migrations
COPY --from=builder /app/packages/database/prisma ./prisma

# Copy bun binary from oven/bun alpine image for CLI tasks
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

# Copy CLI utilities and their runtime dependencies (`admin:reset-password`)
COPY --from=builder /app/apps/dashboard/package.json ./package.json
COPY --from=builder /app/apps/dashboard/bin ./bin

# Create data directory and ensure correct ownership for all files
RUN mkdir -p /app/data && chown -R nuxtjs:nuxtjs /app

# Copy entrypoint script
COPY --from=builder /app/apps/dashboard/entrypoint.sh /entrypoint.sh

# Do not switch user here; entrypoint.sh will drop privileges using su-exec

EXPOSE 3000

LABEL org.opencontainers.image.source="https://github.com/darkrei08/waforge"
LABEL org.opencontainers.image.description="WaForge — Dashboard WhatsApp Mass Messaging"
LABEL org.opencontainers.image.licenses="AGPL-3.0"

ENTRYPOINT ["/entrypoint.sh"]

# Run migrations then start Nitro server
# Resolve any previously failed migration (safe no-op on fresh installs)
CMD ["sh", "-c", "npx prisma@5.22.0 migrate resolve --schema=./prisma/schema.prisma --rolled-back 20260708162400_add_optin_and_chat_wamid 2>/dev/null; npx prisma@5.22.0 migrate deploy --schema=./prisma/schema.prisma; node .output/server/index.mjs"]
