#!/bin/bash
set -e

echo "🚀 Configurando entorno de desarrollo..."

# Instala dependencias
pnpm install

# Genera Prisma
pnpm db:generate

# Crea alias útiles
cat >> ~/.bashrc << 'EOF'

# Aliases para limpieza rápida
alias clean-next="rm -rf .next .turbo"
alias clean-cache="rm -rf node_modules/.cache"
alias clean-all="rm -rf node_modules .next .turbo pnpm-lock.yaml && pnpm install"
alias restart-dev="pkill -f 'next dev' || true && pnpm dev"

EOF

echo "✅ Setup completo!"
