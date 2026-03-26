#!/bin/bash
set -e

# Carga DATABASE_URL_PROD desde .env y la usa como DATABASE_URL para prisma db push
PROD_URL=$(grep '^DATABASE_URL_PROD=' .env | cut -d '=' -f2-)

if [ -z "$PROD_URL" ]; then
  echo "Error: DATABASE_URL_PROD no encontrada en .env"
  exit 1
fi

echo "→ Aplicando schema en producción..."
DATABASE_URL="$PROD_URL" npx prisma db push
