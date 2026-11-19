FROM nginx:1.27-alpine

# Install openssl for dynamic dev cert generation
RUN apk add --no-cache openssl

# Remove default nginx configs
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom reverse proxy configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Directory for certificates
RUN mkdir -p /etc/nginx/certs /var/www/certbot

# Auto-generate self-signed cert if not provided
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/server.key \
    -out /etc/nginx/certs/server.crt \
    -subj "/C=US/ST=Tech/L=PulseSupply/O=PulseSupply Inc/CN=localhost"

EXPOSE 80 443

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

