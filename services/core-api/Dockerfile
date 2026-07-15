FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy root files
COPY package.json bun.lock ./

# Copy monorepo packages
COPY services/core-api/package.json services/core-api/
COPY packages/database/package.json packages/database/

# Install dependencies
RUN bun install --ignore-scripts

# Copy the rest
COPY services/core-api services/core-api/
COPY packages/database packages/database/

# Generate prisma client
WORKDIR /app/packages/database
RUN bunx prisma generate

# Final stage
FROM oven/bun:1-alpine AS runner

WORKDIR /app

# Install openssl for prisma
RUN apk add --no-cache openssl

# Copy node_modules and built code from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/services/core-api ./services/core-api

WORKDIR /app/services/core-api

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
