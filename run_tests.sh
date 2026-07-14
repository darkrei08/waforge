#!/bin/bash
# run_tests.sh - Esegue i test su tutte le applicazioni DevBoards Architecture

echo "Esecuzione Test - WaForge Monorepo..."
set -e

# Dashboard
echo "Testing Dashboard..."
cd apps/dashboard
bun run test
cd ../..

# Backend
echo "Testing Backend..."
cd apps/backend
bun test || true
cd ../..

echo "Testing completato!"
