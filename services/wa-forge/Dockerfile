FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./

# Copy the shared database package
COPY packages/database/package.json packages/database/
COPY packages/database/ ./packages/database/

# Copy the wa-forge service
COPY services/wa-forge/package.json services/wa-forge/
COPY services/wa-forge/ ./services/wa-forge/

# Install dependencies (without --frozen-lockfile since we only copy a subset of workspace packages)
RUN bun install --ignore-scripts

# Generate Prisma Client
RUN cd packages/database && bunx prisma generate

WORKDIR /app/services/wa-forge
EXPOSE 3010

CMD ["bun", "run", "src/index.ts"]
