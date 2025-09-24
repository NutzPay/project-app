# Nutz Beta - Development Makefile
# Simplified commands for common development tasks

.PHONY: help install setup dev build test clean docker-up docker-down db-reset db-migrate db-seed

# Default target
help: ## Show available commands
	@echo "Nutz Beta - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Installation and Setup
install: ## Install all dependencies
	@echo "Installing dependencies..."
	@pnpm install

setup: ## Run complete project setup
	@echo "Running complete setup..."
	@chmod +x setup.sh
	@./setup.sh

# Development
dev: ## Start development servers
	@echo "Starting development servers..."
	@pnpm run dev

build: ## Build all applications
	@echo "Building applications..."
	@pnpm run build

test: ## Run all tests
	@echo "Running tests..."
	@pnpm run test

lint: ## Run linting
	@echo "Running linters..."
	@pnpm run lint

typecheck: ## Run type checking
	@echo "Running type checks..."
	@pnpm run typecheck

# Docker Services
docker-up: ## Start Docker services (PostgreSQL, Redis, etc.)
	@echo "Starting Docker services..."
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started. Access:"
	@echo "  - PostgreSQL: localhost:5432"
	@echo "  - Redis: localhost:6379"
	@echo "  - PgAdmin: http://localhost:8080 (admin@nutzbeta.local / admin)"
	@echo "  - Redis Commander: http://localhost:8081 (admin / admin)"
	@echo "  - MailHog: http://localhost:8025"

docker-down: ## Stop Docker services
	@echo "Stopping Docker services..."
	@docker-compose -f docker-compose.dev.yml down

docker-logs: ## View Docker services logs
	@docker-compose -f docker-compose.dev.yml logs -f

docker-restart: ## Restart Docker services
	@make docker-down
	@make docker-up

# Database Management
db-reset: ## Reset database (drop and recreate)
	@echo "Resetting database..."
	@make docker-down
	@docker volume rm nutzbeta-postgres-data 2>/dev/null || true
	@make docker-up
	@sleep 10
	@make db-migrate
	@make db-seed

db-migrate: ## Run database migrations
	@echo "Running database migrations..."
	@pnpm --filter api run db:migrate

db-seed: ## Seed database with initial data
	@echo "Seeding database..."
	@pnpm --filter api run db:seed

db-studio: ## Open Prisma Studio
	@echo "Opening Prisma Studio..."
	@pnpm --filter api run db:studio

db-generate: ## Generate Prisma client
	@echo "Generating Prisma client..."
	@pnpm --filter api run db:generate

# SSL Certificates
ssl-generate: ## Generate SSL certificates for development
	@echo "Generating SSL certificates..."
	@mkdir -p config/ssl
	@openssl req -x509 -newkey rsa:4096 -keyout config/ssl/localhost.key -out config/ssl/localhost.crt -days 365 -nodes -subj "/C=BR/ST=SP/L=São Paulo/O=Nutz Beta/CN=localhost"
	@echo "SSL certificates generated in config/ssl/"

# Cleanup
clean: ## Clean all build artifacts and dependencies
	@echo "Cleaning build artifacts..."
	@rm -rf node_modules
	@rm -rf apps/web/node_modules
	@rm -rf apps/docs/node_modules
	@rm -rf services/api/node_modules
	@rm -rf apps/web/.next
	@rm -rf apps/docs/build
	@rm -rf services/api/dist
	@pnpm store prune

clean-docker: ## Clean Docker volumes and images
	@echo "Cleaning Docker resources..."
	@docker-compose -f docker-compose.dev.yml down -v
	@docker volume prune -f
	@docker image prune -f

# Production helpers
prod-build: ## Build for production
	@echo "Building for production..."
	@NODE_ENV=production pnpm run build

prod-test: ## Run production tests
	@echo "Running production tests..."
	@NODE_ENV=production pnpm run test

# Security
security-audit: ## Run security audit
	@echo "Running security audit..."
	@pnpm audit
	@pnpm --filter web audit
	@pnpm --filter api audit

# Logs
logs: ## Show application logs
	@echo "Showing application logs..."
	@tail -f apps/web/.next/server.log 2>/dev/null || echo "No web logs found"

# Quick start command
quick-start: ## Quick start for first-time setup
	@echo "Quick start setup..."
	@make install
	@make docker-up
	@sleep 15
	@make db-migrate
	@make db-seed
	@echo ""
	@echo "Setup complete! Run 'make dev' to start development servers."

# Status check
status: ## Check service status
	@echo "Checking service status..."
	@echo ""
	@echo "Docker Services:"
	@docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "Docker services not running"
	@echo ""
	@echo "Database Connection:"
	@docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U nutzbeta -d nutzbeta 2>/dev/null && echo "✅ PostgreSQL is ready" || echo "❌ PostgreSQL is not ready"
	@echo ""
	@echo "Redis Connection:"
	@docker-compose -f docker-compose.dev.yml exec redis redis-cli ping 2>/dev/null | grep -q PONG && echo "✅ Redis is ready" || echo "❌ Redis is not ready"