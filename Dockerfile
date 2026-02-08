# ========================================
# Stage 1: Build Frontend
# ========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files and configs
COPY package*.json ./
COPY tsconfig*.json ./
COPY next.config.mjs ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source - Next.js uses app/ and src/ directories
COPY app/ ./app/
COPY src/ ./src/
COPY public/ ./public/

# Build frontend
RUN npm run build

# ========================================
# Stage 2: Build Backend
# ========================================
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY drizzle.config.ts ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy backend source
COPY server/ ./server/
COPY server.ts ./
COPY drizzle/ ./drizzle/
COPY src/lib/ ./src/lib/

# Build TypeScript to dist-server folder
RUN npx tsc -p tsconfig.server.json

# ========================================
# Stage 3: Production Runtime
# ========================================
FROM node:20-alpine

# Install dumb-init (proper signal handling)
RUN apk add --no-cache dumb-init

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built assets - Next.js outputs to .next folder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/.next ./.next
COPY --from=frontend-builder --chown=nodejs:nodejs /app/public ./public
COPY --from=backend-builder --chown=nodejs:nodejs /app/dist-server ./dist-server
COPY --chown=nodejs:nodejs drizzle/ ./drizzle/

# Create directories for runtime
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application - server.ts compiles to dist-server/server.js
CMD ["node", "dist-server/server.js"]
