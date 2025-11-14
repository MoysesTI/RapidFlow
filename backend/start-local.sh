#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# RAPIDFLOW - INICIAR SERVIDOR LOCAL
# ═══════════════════════════════════════════════════════════════

echo "🚀 Iniciando RapidFlow em modo local..."

# Limpar variáveis de ambiente de produção
unset DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD DB_SSL DATABASE_URL

# Iniciar servidor
npm start
