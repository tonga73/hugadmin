#!/bin/bash
set -e

PROD_URL=$(grep '^DATABASE_URL_PROD=' .env | cut -d '=' -f2- | tr -d '"')

if [ -z "$PROD_URL" ]; then
  echo "Error: DATABASE_URL_PROD no encontrada en .env"
  exit 1
fi

echo "→ Eliminando duplicados vacíos en producción..."
DATABASE_URL="$PROD_URL" npx tsx scripts/delete-empty-duplicates.ts
