FROM oven/bun:1-alpine AS base

# Set working directory
WORKDIR /app

# Create user and data directory with proper permissions
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    mkdir -p /home/appuser/.postgeist && \
    chown -R appuser:appgroup /app /home/appuser

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Development stage
FROM base AS dev
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
USER appuser
EXPOSE 3000
CMD ["bun", "run", "dev"]

# Production build stage
FROM base AS build
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

# Production stage
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY package.json bun.lockb ./

# Copy configuration files
COPY .env.example .env.example
COPY README.md LICENSE ./
COPY scripts/ ./scripts/

# Set proper ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun run src/index.ts --help || exit 1

# Default command
CMD ["bun", "run", "start"]

# Labels for metadata
LABEL org.label-schema.name="Postgeist" \
      org.label-schema.description="AI-Powered Twitter Analysis & Content Generation Tool" \
      org.label-schema.version="0.1.0" \
      org.label-schema.schema-version="1.0"
