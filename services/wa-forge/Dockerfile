FROM oven/bun:1 AS base
WORKDIR /app

# Copy workspace root files
COPY package.json bun.lock ./

# Copy the shared database package
COPY packages/database/ ./packages/database/

# Copy the wa-forge service
COPY services/wa-forge/ ./services/wa-forge/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Client
RUN cd packages/database && bunx prisma generate

WORKDIR /app/services/wa-forge
EXPOSE 3010

CMD ["bun", "run", "src/index.ts"]
