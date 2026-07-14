#!/bin/bash
# run_linters.sh - Esegue il linting su tutte le applicazioni DevBoards Architecture

echo "Esecuzione Linting - WaForge Monorepo..."
set -e

# Dashboard
echo "Linting Dashboard..."
cd apps/dashboard
bun run typecheck || true
bun run lint || true
cd ../..

echo "Linting completato!"
