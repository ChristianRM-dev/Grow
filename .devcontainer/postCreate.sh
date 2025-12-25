#!/usr/bin/env bash
set -euo pipefail

# Install deps automatically only if a Next project already exists.
if [ -f package.json ]; then
  corepack enable >/dev/null 2>&1 || true
  pnpm install
fi

echo ""
echo "Devcontainer listo ✅"
echo "Siguiente paso: dentro del contenedor crea el proyecto Next.js (ver instrucciones del chat)."
echo ""
