#!/bin/sh
set -e

# Assicura che la directory dei dati esista e abbia i permessi corretti
mkdir -p /app/data/uploads
chown -R nuxtjs:nuxtjs /app/data

# Esegue il comando passato come argomento (Dockerfile CMD) usando l'utente non privilegiato
exec su-exec nuxtjs "$@"
