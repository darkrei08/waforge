# ─── Build Stage ──────────────────────────────────────────────────────────
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --ignore-scripts

COPY . .
RUN bun run postinstall
RUN bunx prisma generate
RUN bun run build

# ─── Production Stage ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner

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

# Create data directory for SQLite
RUN mkdir -p /app/data && chown -R nuxtjs:nuxtjs /app/data /app/.output

USER nuxtjs

EXPOSE 3000

LABEL org.opencontainers.image.source="https://github.com/darkrei08/waforge"
LABEL org.opencontainers.image.description="WaForge — Dashboard WhatsApp Mass Messaging"
LABEL org.opencontainers.image.licenses="AGPL-3.0"

# Run migrations then start Nitro server
CMD ["sh", "-c", "npx prisma@5.22.0 migrate deploy; node .output/server/index.mjs"]
