#!/bin/bash

# Nutz Beta - Setup Script
# Este script configura todo o ambiente de desenvolvimento

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art Logo
echo -e "${BLUE}"
echo "╔═══════════════════════════════════╗"
echo "║           NUTZ BETA               ║"
echo "║     Gateway de Pagamentos         ║"
echo "║        Setup Automático           ║"
echo "╚═══════════════════════════════════╝"
echo -e "${NC}"

# Function to print colored output
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Verificando pré-requisitos..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("Node.js (>=18.0.0)")
    else
        node_version=$(node --version | cut -d'v' -f2)
        if ! node -e "process.exit(process.version.split('.')[0] >= 18 ? 0 : 1)"; then
            missing_deps+=("Node.js (>=18.0.0) - Versão atual: $node_version")
        fi
    fi
    
    if ! command_exists pnpm; then
        missing_deps+=("pnpm (>=8.0.0)")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("Docker Compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Dependências faltando:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        log_info "Instale as dependências necessárias:"
        echo "  Node.js: https://nodejs.org/"
        echo "  pnpm: npm install -g pnpm"
        echo "  Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    log_success "Todos os pré-requisitos estão instalados"
}

# Generate secure secrets
generate_secrets() {
    log_info "Gerando chaves de segurança..."
    
    # Generate random secrets
    SESSION_SECRET=$(openssl rand -base64 48 | tr -d '=' | tr '+/' '_-')
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '=' | tr '+/' '_-')
    API_KEY_SALT=$(openssl rand -base64 48 | tr -d '=' | tr '+/' '_-')
    
    log_success "Chaves de segurança geradas"
}

# Setup environment files
setup_env_files() {
    log_info "Configurando arquivos de ambiente..."
    
    # Root .env
    if [ ! -f .env ]; then
        cp .env.example .env
        
        # Replace placeholders with generated secrets
        sed -i.bak "s/your-session-secret-min-32-chars-long/$SESSION_SECRET/g" .env
        sed -i.bak "s/your-jwt-secret-min-32-chars-long/$JWT_SECRET/g" .env
        sed -i.bak "s/your-api-key-salt-min-32-chars-long/$API_KEY_SALT/g" .env
        rm .env.bak
        
        log_success "Arquivo .env criado"
    else
        log_warning "Arquivo .env já existe, pulando..."
    fi
    
    # Web app .env.local
    if [ ! -f apps/web/.env.local ]; then
        cat > apps/web/.env.local << EOF
# Database
DATABASE_URL="postgresql://nutzbeta:password@localhost:5432/nutzbeta"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$SESSION_SECRET"

# API
API_BASE_URL="http://localhost:3001"
INTERNAL_API_SECRET="$JWT_SECRET"

# XGate
XGATE_BASE_URL="https://api.xgate.com.br"
XGATE_API_KEY=""
XGATE_SECRET=""

# CDI API
CDI_API_URL="https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json"

# CoinMarketCap
COINMARKETCAP_API_KEY=""
EOF
        log_success "Arquivo apps/web/.env.local criado"
    else
        log_warning "Arquivo apps/web/.env.local já existe, pulando..."
    fi
    
    # API .env
    if [ ! -f services/api/.env ]; then
        cat > services/api/.env << EOF
# Database
DATABASE_URL="postgresql://nutzbeta:password@localhost:5432/nutzbeta"

# Server
PORT=3001
NODE_ENV="development"

# Authentication
JWT_SECRET="$JWT_SECRET"
API_KEY_SALT="$API_KEY_SALT"

# CORS
ALLOWED_ORIGINS="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="300"

# Monitoring
LOG_LEVEL="debug"
EOF
        log_success "Arquivo services/api/.env criado"
    else
        log_warning "Arquivo services/api/.env já existe, pulando..."
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Instalando dependências..."
    
    pnpm install
    
    log_success "Dependências instaladas"
}

# Setup database
setup_database() {
    log_info "Configurando banco de dados..."
    
    # Start PostgreSQL with Docker
    docker-compose up -d postgres redis
    
    # Wait for PostgreSQL to be ready
    log_info "Aguardando PostgreSQL ficar disponível..."
    timeout=60
    while ! docker-compose exec -T postgres pg_isready -h localhost -p 5432 -U nutzbeta > /dev/null 2>&1; do
        timeout=$((timeout - 1))
        if [ $timeout -eq 0 ]; then
            log_error "Timeout aguardando PostgreSQL"
            exit 1
        fi
        sleep 1
    done
    
    log_success "PostgreSQL está disponível"
    
    # Run database migrations
    log_info "Executando migrações do banco..."
    cd services/api
    pnpm prisma migrate deploy
    cd ../..
    
    # Generate Prisma client
    log_info "Gerando cliente Prisma..."
    cd services/api
    pnpm prisma generate
    cd ../..
    
    # Run seeds
    log_info "Populando dados iniciais..."
    cd services/api
    pnpm run seed
    cd ../..
    
    log_success "Banco de dados configurado"
}

# Generate SSL certificates for development
generate_ssl_certs() {
    log_info "Gerando certificados SSL para desenvolvimento..."
    
    mkdir -p config/ssl
    
    if [ ! -f config/ssl/localhost.crt ]; then
        # Generate private key
        openssl genrsa -out config/ssl/localhost.key 2048
        
        # Generate certificate signing request
        openssl req -new -key config/ssl/localhost.key -out config/ssl/localhost.csr \
            -subj "/C=BR/ST=SP/L=São Paulo/O=Nutz Beta/OU=Development/CN=localhost"
        
        # Generate self-signed certificate
        openssl x509 -req -in config/ssl/localhost.csr -signkey config/ssl/localhost.key \
            -out config/ssl/localhost.crt -days 365 \
            -extensions v3_req -extfile <(
                echo '[v3_req]'
                echo 'keyUsage = keyEncipherment, dataEncipherment'
                echo 'extendedKeyUsage = serverAuth'
                echo 'subjectAltName = @alt_names'
                echo '[alt_names]'
                echo 'DNS.1 = localhost'
                echo 'DNS.2 = *.localhost'
                echo 'IP.1 = 127.0.0.1'
                echo 'IP.2 = ::1'
            )
        
        # Clean up CSR
        rm config/ssl/localhost.csr
        
        log_success "Certificados SSL gerados"
    else
        log_warning "Certificados SSL já existem, pulando..."
    fi
}

# Create admin user
create_admin_user() {
    log_info "Criando usuário administrativo..."
    
    read -p "Digite o email do admin: " ADMIN_EMAIL
    read -s -p "Digite a senha do admin: " ADMIN_PASSWORD
    echo
    
    # Hash the password and create admin user
    cd services/api
    node -e "
        const bcrypt = require('bcrypt');
        const { PrismaClient } = require('@prisma/client');
        
        async function createAdmin() {
            const prisma = new PrismaClient();
            const hashedPassword = await bcrypt.hash('$ADMIN_PASSWORD', 12);
            
            try {
                const admin = await prisma.user.upsert({
                    where: { email: '$ADMIN_EMAIL' },
                    update: {},
                    create: {
                        email: '$ADMIN_EMAIL',
                        name: 'Administrator',
                        password: hashedPassword,
                        role: 'SUPER_ADMIN',
                        status: 'ACTIVE',
                        emailVerified: true,
                        emailVerifiedAt: new Date()
                    }
                });
                console.log('Admin user created:', admin.email);
            } catch (error) {
                console.error('Error creating admin:', error.message);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createAdmin();
    "
    cd ../..
    
    log_success "Usuário administrativo criado"
}

# Main setup function
main() {
    log_info "Iniciando setup do Nutz Beta..."
    echo
    
    check_prerequisites
    generate_secrets
    setup_env_files
    install_dependencies
    setup_database
    generate_ssl_certs
    create_admin_user
    
    echo
    log_success "Setup concluído com sucesso!"
    echo
    log_info "Próximos passos:"
    echo "  1. Configure as variáveis de API no arquivo .env"
    echo "  2. Execute: pnpm dev"
    echo "  3. Acesse: http://localhost:3000"
    echo "  4. API: http://localhost:3001"
    echo "  5. Docs: http://localhost:3002"
    echo
    log_info "Para parar os serviços: pnpm run docker:down"
    log_info "Para ver logs: docker-compose logs -f"
    echo
}

# Run setup if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi