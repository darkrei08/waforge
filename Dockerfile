# ─── Build Stage ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install openssl and copy bun binary for superfast package installation
RUN apk add --no-cache openssl bash
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

COPY package.json bun.lock ./
RUN bun install --ignore-scripts

COPY . .
RUN bun run postinstall
RUN bunx prisma generate
# Run nuxt build via Node to prevent Bun fs async I/O race condition (ENOENT on rollup server bundles)
RUN npx nuxt build

# ─── Production Stage ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install openssl so Prisma can detect OpenSSL 3.x correctly instead of defaulting to 1.1.x
RUN apk add --no-cache openssl

RUN addgroup --system --gid 1001 nuxtjs && \
    adduser --system --uid 1001 nuxtjs

# Copy Nitro server output
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy bun binary from oven/bun alpine image for CLI tasks
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

# Copy CLI utilities and their runtime dependencies (`admin:reset-password`)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Create data directory and ensure correct ownership for all files
RUN mkdir -p /app/data && chown -R nuxtjs:nuxtjs /app

USER nuxtjs

EXPOSE 3000

LABEL org.opencontainers.image.source="https://github.com/darkrei08/waforge"
LABEL org.opencontainers.image.description="WaForge — Dashboard WhatsApp Mass Messaging"
LABEL org.opencontainers.image.licenses="AGPL-3.0"

# Run migrations then start Nitro server
# Resolve any previously failed migration (safe no-op on fresh installs)
CMD ["sh", "-c", "npx prisma@5.22.0 migrate resolve --rolled-back 20260708162400_add_optin_and_chat_wamid 2>/dev/null; npx prisma@5.22.0 migrate deploy; node .output/server/index.mjs"]
