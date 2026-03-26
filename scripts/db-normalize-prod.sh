#!/bin/bash
set -e

# Carga DATABASE_URL_PROD desde .env y corre el script de normalización de orders
PROD_URL=$(grep '^DATABASE_URL_PROD=' .env | cut -d '=' -f2-)

if [ -z "$PROD_URL" ]; then
  echo "Error: DATABASE_URL_PROD no encontrada en .env"
  exit 1
fi

echo "→ Normalizando números de expediente en producción..."
DATABASE_URL="$PROD_URL" npx tsx scripts/normalize-orders.ts
