# =============================================================================
# Dockerfile — Election Assistant
# Multi-stage production build for Google Cloud Run deployment.
#
# Stage 1 (deps):    Install only production dependencies.
# Stage 2 (builder): Build the Next.js application.
# Stage 3 (runner):  Minimal production image with non-root user.
#
# Security practices:
#   - Uses a non-root user in the final stage.
#   - Only copies the minimal build artifacts.
#   - Leverages Next.js standalone output for a smaller image.
# =============================================================================

# ----- Stage 1: Dependency Installation -----
FROM node:22-alpine AS deps

# Install OS packages needed for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json package-lock.json ./

# Install ALL dependencies (needed for build)
RUN npm ci --ignore-scripts

# ----- Stage 2: Application Build -----
FROM node:22-alpine AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables (injected by Cloud Build)
ARG GOOGLE_CLOUD_PROJECT
ARG GOOGLE_CLOUD_LOCATION
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID
ARG NEXT_PUBLIC_GTM_ID

# Set environment for Next.js build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# ----- Stage 3: Production Runner -----
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary output from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Cloud Run serves on port 8080 by default
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start the Next.js standalone server
CMD ["node", "server.js"]
