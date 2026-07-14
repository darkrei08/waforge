#!/bin/bash
# start_dev.sh - Avvia tutte le applicazioni DevBoards Architecture in parallelo

echo "Avvio di WaForge Monorepo in modalità sviluppo..."

# Avvia backend
cd apps/backend && bun run dev &
BACKEND_PID=$!

# Avvia dashboard (Nuxt)
cd apps/dashboard && bun run dev &
DASHBOARD_PID=$!

# Avvia frontend (Astro)
cd apps/frontend && bun run dev &
FRONTEND_PID=$!

# Trap per chiudere tutto alla pressione di CTRL+C
trap "echo 'Chiusura di tutti i servizi...'; kill $BACKEND_PID $DASHBOARD_PID $FRONTEND_PID; exit" INT TERM

wait
