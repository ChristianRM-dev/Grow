#!/bin/bash
set -e

echo "🧹 Limpiando caché..."

# Limpia cache de Next.js si es mayor a 500MB
NEXTJS_CACHE_SIZE=$(du -sm .next 2>/dev/null | cut -f1 || echo "0")
if [ "$NEXTJS_CACHE_SIZE" -gt 500 ]; then
  echo "⚠️  Cache de .next muy grande ($NEXTJS_CACHE_SIZE MB), limpiando..."
  rm -rf .next
fi

# Limpia cache de Turbopack si es mayor a 300MB
TURBO_CACHE_SIZE=$(du -sm .turbo 2>/dev/null | cut -f1 || echo "0")
if [ "$TURBO_CACHE_SIZE" -gt 300 ]; then
  echo "⚠️  Cache de .turbo muy grande ($TURBO_CACHE_SIZE MB), limpiando..."
  rm -rf .turbo
fi

# Limpia logs viejos
find . -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Mata procesos de Next.js huérfanos
pkill -f 'next dev' 2>/dev/null || true

# Regenera Prisma si es necesario
if [ ! -d "src/generated/prisma" ]; then
  echo "🔧 Regenerando Prisma Client..."
  pnpm db:generate
fi

echo "✅ Limpieza completa!"
