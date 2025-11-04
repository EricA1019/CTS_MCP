# CTS MCP Server - Production Dockerfile
# 
# Multi-stage build for minimal image size
# Based on Alpine Linux for security and size efficiency

# Stage 1: Build
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Run tests to ensure build is valid
RUN npm test

# Stage 2: Production
FROM node:20-alpine

# Install runtime dependencies only
RUN apk add --no-cache \
    tini \
    # For tree-sitter native modules
    python3 \
    make \
    g++

# Create non-root user
RUN addgroup -g 1001 -S cts && \
    adduser -u 1001 -S cts -G cts

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/build ./build

# Copy necessary files
COPY README.md LICENSE CHANGELOG.md ./

# Change ownership to non-root user
RUN chown -R cts:cts /app

# Switch to non-root user
USER cts

# Expose MCP stdio interface (no network ports)
# MCP uses stdin/stdout for communication

# Health check (validates server can start)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('./build/index.js')" || exit 1

# Use tini as init system (proper signal handling)
ENTRYPOINT ["/sbin/tini", "--"]

# Start CTS MCP server
CMD ["node", "build/index.js"]

# Labels for metadata
LABEL org.opencontainers.image.title="CTS MCP Server"
LABEL org.opencontainers.image.description="Model Context Protocol server for CTS automation"
LABEL org.opencontainers.image.version="3.0.0"
LABEL org.opencontainers.image.authors="Broken Divinity Team"
LABEL org.opencontainers.image.source="https://github.com/broken-divinity/prototypeBD"
LABEL org.opencontainers.image.licenses="MIT"
