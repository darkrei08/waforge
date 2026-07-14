FROM oven/bun:1 as builder
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
COPY packages/database/package.json packages/database/
RUN bun install

# Copy source
COPY . .

# Generate Prisma
WORKDIR /app/packages/database
RUN bunx prisma generate

FROM oven/bun:1 as runner
WORKDIR /app

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/backend /app/apps/backend
COPY --from=builder /app/packages/database /app/packages/database

WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
