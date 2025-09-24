#!/bin/bash

# Script para configurar cron job de timeout de transações
PROJECT_DIR="/Users/felixelmada/Desktop/nutz-current-20250909-195539"
API_DIR="$PROJECT_DIR/services/api"
SCRIPT_PATH="$API_DIR/simple-timeout-checker.js"
LOG_PATH="$PROJECT_DIR/timeout-checker.log"

echo "🕒 Configurando sistema de timeout de transações..."

# Verificar se o script existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Script não encontrado: $SCRIPT_PATH"
    exit 1
fi

# Criar entrada do cron job
CRON_JOB="*/5 * * * * cd $API_DIR && DATABASE_URL='postgresql://nutzbeta:password@localhost:5433/nutzbeta' /usr/local/bin/node simple-timeout-checker.js >> $LOG_PATH 2>&1"

echo "📋 Configurando cron job..."
echo "   Script: $SCRIPT_PATH"
echo "   Log: $LOG_PATH"
echo "   Frequência: A cada 5 minutos"
echo ""

# Backup do crontab atual
echo "📂 Fazendo backup do crontab atual..."
crontab -l > "$PROJECT_DIR/crontab-backup-$(date +%Y%m%d-%H%M%S).txt" 2>/dev/null || true

# Remover entradas antigas do timeout checker se existirem
echo "🧹 Removendo entradas antigas..."
crontab -l 2>/dev/null | grep -v "simple-timeout-checker.js" | crontab - 2>/dev/null || true

# Adicionar nova entrada
echo "➕ Adicionando nova entrada..."
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verificar se foi adicionado
echo "✅ Verificando configuração..."
if crontab -l | grep -q "simple-timeout-checker.js"; then
    echo "🎉 Cron job configurado com sucesso!"
    echo ""
    echo "📊 Configuração atual:"
    crontab -l | grep "simple-timeout-checker.js"
    echo ""
    echo "📝 Para monitorar:"
    echo "   tail -f $LOG_PATH"
    echo ""
    echo "🛠️  Para desabilitar:"
    echo "   crontab -l | grep -v 'simple-timeout-checker.js' | crontab -"
else
    echo "❌ Erro ao configurar cron job"
    exit 1
fi

# Criar log inicial
echo "$(date): Sistema de timeout configurado" > "$LOG_PATH"

echo "✨ Configuração concluída!"
echo "   As transações pendentes por mais de 15 minutos serão automaticamente marcadas como falhadas"
echo "   Verificação: A cada 5 minutos"
echo "   Log: $LOG_PATH"