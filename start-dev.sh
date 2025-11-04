#!/bin/bash

# 🚀 Nutz Beta - Start Development Environment
# Este script automatiza toda a configuração para desenvolvimento

set -e

echo "🚀 Iniciando ambiente de desenvolvimento do Nutz Beta..."

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

# Verificar se estamos no diretório correto
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"
print_status "Mudando para diretório do projeto: $PROJECT_DIR"

# 1. Verificar e iniciar Docker Desktop
print_status "Verificando Docker Desktop..."
if ! docker info >/dev/null 2>&1; then
    print_warning "Docker não está rodando. Iniciando Docker Desktop..."
    open -a Docker
    print_status "Aguardando Docker iniciar..."
    
    # Aguardar Docker ficar disponível (máximo 60 segundos)
    for i in {1..60}; do
        if docker info >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker não conseguiu iniciar. Verifique a instalação."
        exit 1
    fi
fi
print_success "Docker está rodando"

# 2. Iniciar containers do projeto (PostgreSQL e Redis)
print_status "Iniciando containers do projeto..."
docker-compose -f docker-compose.dev.yml up -d
if [ $? -eq 0 ]; then
    print_success "Containers iniciados (PostgreSQL:5433, Redis:6380)"
else
    print_error "Erro ao iniciar containers"
    exit 1
fi

# 3. Aguardar containers ficarem prontos
print_status "Aguardando containers ficarem prontos..."
sleep 5

# 4. Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    print_status "Instalando dependências..."
    pnpm install
fi

# 5. Executar migrações do banco se necessário
print_status "Executando migrações do banco..."
cd apps/web
npx prisma db push --skip-generate
cd ../..
print_success "Migrações executadas"

# 6. Iniciar ngrok em background
print_status "Iniciando ngrok na porta 3001..."
pkill -f "ngrok http 3001" 2>/dev/null || true # Mata ngrok existente
nohup ngrok http 3001 --log=stdout --log-format=term > /dev/null 2>&1 &
NGROK_PID=$!
sleep 3
print_success "Ngrok iniciado (PID: $NGROK_PID)"

# 7. Iniciar API em background
print_status "Iniciando API NestJS..."
nohup pnpm --filter @nutzbeta/api run dev > api.log 2>&1 &
API_PID=$!
print_success "API iniciada (PID: $API_PID) - Log em api.log"

# 8. Iniciar Web em background
print_status "Iniciando Web Next.js..."
nohup pnpm --filter @nutzbeta/web run dev > web.log 2>&1 &
WEB_PID=$!
print_success "Web iniciada (PID: $WEB_PID) - Log em web.log"

# 9. Aguardar serviços ficarem prontos
print_status "Aguardando serviços ficarem prontos..."
sleep 10

# 10. Abrir URLs no navegador
print_status "Abrindo URLs no navegador..."
sleep 5 # Aguardar mais um pouco
open "http://localhost:3000" # Frontend
open "http://localhost:3001" # API

# 11. Abrir Claude Code no projeto
print_status "Abrindo Claude Code no projeto..."
sleep 2
open "https://claude.ai/code" # Claude Code no navegador

# Criar arquivo com PIDs para facilitar parada dos serviços
echo "NGROK_PID=$NGROK_PID" > .dev-pids
echo "API_PID=$API_PID" >> .dev-pids  
echo "WEB_PID=$WEB_PID" >> .dev-pids

# Mostrar status final
echo ""
print_success "🎉 Ambiente de desenvolvimento iniciado com sucesso!"
echo ""
echo "📋 Serviços rodando:"
echo "   🐳 Docker Containers: PostgreSQL (5433), Redis (6380)"
echo "   🌐 Ngrok: Túnel para porta 3001 (webhook)"
echo "   🏗️  API NestJS: http://localhost:3001"
echo "   💻 Web Next.js: http://localhost:3000"
echo "   🤖 Claude Code: Abrindo no navegador"
echo ""
echo "📊 Logs:"
echo "   API: tail -f $PROJECT_DIR/api.log"
echo "   Web: tail -f $PROJECT_DIR/web.log"
echo ""
echo "🛑 Para parar todos os serviços:"
echo "   ./stop-dev.sh"
echo ""
print_success "Ambiente pronto para desenvolvimento! 🚀"