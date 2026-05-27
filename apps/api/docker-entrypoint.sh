#!/bin/sh
set -e

echo "→ Syncing database schema..."
node_modules/.bin/prisma db push \
  --schema=apps/api/prisma/schema.prisma \
  --skip-generate

echo "→ Starting API server..."
exec node apps/api/dist/main
