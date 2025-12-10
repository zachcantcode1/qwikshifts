FROM oven/bun:1 AS base
WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./

# Copy workspace packages
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/core/package.json ./packages/core/package.json

# Install dependencies (utilizing cache layers)
RUN bun install

# Copy source code
COPY . .

# Build the project
ARG VITE_SELF_HOSTED=true
RUN bun run --filter web --filter api build

# Production image
FROM oven/bun:1 AS runner
WORKDIR /app

# Copy built artifacts and node_modules from base
COPY --from=base /app .

# Enable migrations for self-hosted start
ENV RUN_MIGRATIONS=true

# Expose ports (3000 for API, 4173 for Web Preview)
EXPOSE 3000
EXPOSE 4173

# Default command (overridden in docker-compose)
CMD ["bun", "run", "start"]
