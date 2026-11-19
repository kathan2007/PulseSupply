# ==========================================
# Multi-stage Dockerfile for PulseSupply Frontend (Next.js Static Export -> Nginx)
# Target Image Size: < 50MB (Well under 110MB ceiling)
# ==========================================

# Stage 1: Build Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install libc6-compat if needed by Alpine
RUN apk add --no-cache libc6-compat

# Copy package descriptors
COPY package*.json ./

# Install all dependencies including devDependencies (tailwindcss, postcss, etc.)
RUN npm install --include=dev

# Copy configuration and source files
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY next.config.mjs ./
COPY src ./src
COPY public ./public

# Build Next.js static HTML/CSS/JS export (writes to /app/out)
RUN npm run build

# Stage 2: Minimal Nginx Alpine serving static assets
FROM nginx:1.27-alpine AS runner

# Remove default nginx html files & config
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static output from builder
COPY --from=builder /app/out /usr/share/nginx/html

# Create non-root nginx user permission setup
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER nginx

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

