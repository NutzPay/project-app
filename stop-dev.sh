#!/bin/bash

# 🛑 Nutz Beta - Stop Development Environment
# Este script para todos os serviços de desenvolvimento

set -e

echo "🛑 Parando ambiente de desenvolvimento do Nutz Beta..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="/Users/felixelmada/Sites/Nutz"

# Função para imprimir status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cd "$PROJECT_DIR"

# 1. Ler PIDs dos serviços
if [ -f ".dev-pids" ]; then
    source .dev-pids
    
    # Parar ngrok
    if [ ! -z "$NGROK_PID" ]; then
        print_status "Parando ngrok (PID: $NGROK_PID)..."
        kill $NGROK_PID 2>/dev/null || print_warning "Ngrok já estava parado"
    fi
    
    # Parar API
    if [ ! -z "$API_PID" ]; then
        print_status "Parando API (PID: $API_PID)..."
        kill $API_PID 2>/dev/null || print_warning "API já estava parada"
    fi
    
    # Parar Web
    if [ ! -z "$WEB_PID" ]; then
        print_status "Parando Web (PID: $WEB_PID)..."
        kill $WEB_PID 2>/dev/null || print_warning "Web já estava parada"
    fi
    
    # Remover arquivo de PIDs
    rm .dev-pids
else
    print_warning "Arquivo .dev-pids não encontrado, parando processos por nome..."
fi

# 2. Força parar todos os processos relacionados
print_status "Parando todos os processos relacionados..."
pkill -f "ngrok http 3001" 2>/dev/null || true
pkill -f "@nutzbeta/api" 2>/dev/null || true  
pkill -f "@nutzbeta/web" 2>/dev/null || true
pkill -f "pnpm.*dev" 2>/dev/null || true

# 3. Parar containers Docker
print_status "Parando containers Docker..."
docker-compose -f docker-compose.dev.yml down
if [ $? -eq 0 ]; then
    print_success "Containers Docker parados"
else
    print_warning "Alguns containers podem não ter sido parados corretamente"
fi

# 4. Limpar logs se existirem
if [ -f "api.log" ]; then
    rm api.log
    print_status "Log da API removido"
fi

if [ -f "web.log" ]; then
    rm web.log
    print_status "Log do Web removido"
fi

# 5. Verificar se ainda há processos rodando nas portas
print_status "Verificando portas..."
for port in 3000 3001 5433 6380; do
    if lsof -i :$port >/dev/null 2>&1; then
        print_warning "Porta $port ainda está em uso"
    fi
done

echo ""
print_success "🎉 Ambiente de desenvolvimento parado com sucesso!"
echo ""
echo "💾 Para backup dos dados:"
echo "   docker-compose -f docker-compose.dev.yml up postgres -d"
echo "   pg_dump -h localhost -p 5433 -U nutz_user nutz_db > backup.sql"
echo ""
echo "🚀 Para iniciar novamente:"
echo "   ./start-dev.sh"
echo ""