# Multi-stage build for Box Management System
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npx vite build && node esbuild.config.js

# Production stage
FROM node:20-alpine

# Install necessary packages for SQLite and build tools
RUN apk add --no-cache sqlite python3 make g++

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create directories for persistent data
RUN mkdir -p /app/data /app/uploads/receipts && \
    chown -R nodejs:nodejs /app/data /app/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Start application
CMD ["node", "dist/index.js"]