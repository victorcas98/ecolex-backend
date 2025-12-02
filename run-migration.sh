#!/bin/bash
# Script para executar a migration no banco Neon

echo "🔄 Executando migration no banco de dados..."

psql "$DATABASE_URL" -f migrations/001_update_schema.sql

echo "✅ Migration concluída!"
