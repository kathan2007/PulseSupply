#!/bin/sh
# =============================================================
# PulseSupply Order Service — Docker Entrypoint Script
# Runs Prisma migrations before starting the Node.js server.
# This ensures the database schema is always up-to-date on
# container startup, enabling zero-downtime rolling deploys.
# =============================================================
set -e

echo "⏳ Waiting for database to be ready..."
# pg_isready isn't available here, so we retry the Prisma migration
MAX_RETRIES=15
RETRY_INTERVAL=3
attempt=1

until npx prisma db push --skip-generate --schema=./prisma/schema.prisma; do
  if [ $attempt -ge $MAX_RETRIES ]; then
    echo "❌ Prisma schema synchronization failed after $MAX_RETRIES attempts. Exiting."
    exit 1
  fi
  echo "⚠️  Database sync attempt $attempt/$MAX_RETRIES failed — retrying in ${RETRY_INTERVAL}s..."
  attempt=$((attempt + 1))
  sleep $RETRY_INTERVAL
done

echo "✅ Database schema synchronized successfully."
echo "🚀 Starting PulseSupply Order & Auth Service..."
exec "$@"

