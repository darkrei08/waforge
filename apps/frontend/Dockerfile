FROM oven/bun:1 as base
WORKDIR /app

# Install dependencies
COPY package.json .
COPY apps/frontend/package.json apps/frontend/
RUN bun install

# Copy source and build
COPY . .
WORKDIR /app/apps/frontend
RUN bun run build

CMD ["bun", "x", "serve", "dist", "-p", "4321"]
