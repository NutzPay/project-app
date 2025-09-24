# 🚀 Nutz Beta - Guia de Desenvolvimento

Este guia explica como iniciar rapidamente o ambiente de desenvolvimento do Nutz Beta com um clique.

## ⚡ Início Rápido

### Opção 1: Aplicativos Clicáveis (Recomendado)

No seu Desktop, você encontrará dois aplicativos:

- **🚀 Start Nutz Dev.app** - Clique para iniciar tudo
- **🛑 Stop Nutz Dev.app** - Clique para parar tudo

### Opção 2: Scripts no Terminal

```bash
# Entrar no diretório do projeto
cd /Users/felixelmada/Desktop/nutz-current-20250909-195539

# Iniciar ambiente de desenvolvimento
./start-dev.sh

# Parar ambiente de desenvolvimento
./stop-dev.sh
```

## 🔧 O que acontece quando você clica "Start"?

1. **🐳 Docker Desktop** é iniciado automaticamente
2. **📦 Containers** PostgreSQL (porta 5433) e Redis (porta 6380) sobem
3. **🌐 ngrok** é iniciado para túnel na porta 3001 (webhooks)
4. **🏗️ API NestJS** é iniciada em http://localhost:3001
5. **💻 Web Next.js** é iniciada em http://localhost:3000
6. **🌍 Navegador** abre as URLs automaticamente
7. **🤖 Claude Code** é aberto para você trabalhar

## 📋 URLs de Acesso

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **pgAdmin**: http://localhost:8080 (se configurado)
- **Redis Commander**: http://localhost:8081 (se configurado)

## 👤 Login para Teste

- **Email**: owner@exemplo.com
- **Senha**: owner123

## 📊 Monitoramento de Logs

```bash
# Ver logs da API
tail -f api.log

# Ver logs do Web
tail -f web.log

# Ver logs do Docker
docker-compose -f docker-compose.dev.yml logs -f
```

## 🗄️ Banco de Dados

### Conexão Direta ao PostgreSQL
```bash
psql -h localhost -p 5433 -U nutz_user -d nutz_db
```

### Backup do Banco
```bash
pg_dump -h localhost -p 5433 -U nutz_user nutz_db > backup.sql
```

### Restore do Banco
```bash
psql -h localhost -p 5433 -U nutz_user nutz_db < backup.sql
```

## 🔧 Comandos Úteis

### Limpar e Reinstalar Dependências
```bash
rm -rf node_modules apps/web/node_modules apps/api/node_modules
pnpm install
```

### Reset do Banco de Dados
```bash
cd apps/web
npx prisma db push --force-reset
npx prisma db seed
```

### Ver Processos Rodando
```bash
lsof -i :3000  # Web
lsof -i :3001  # API
lsof -i :5433  # PostgreSQL
lsof -i :6380  # Redis
```

## 🆘 Troubleshooting

### Porta já está em uso
```bash
# Matar processo na porta 3000
kill -9 $(lsof -ti:3000)

# Matar processo na porta 3001
kill -9 $(lsof -ti:3001)
```

### Docker não inicia
```bash
# Reiniciar Docker Desktop
killall Docker && open -a Docker
```

### Limpar tudo e começar do zero
```bash
./stop-dev.sh
docker system prune -a
docker-compose -f docker-compose.dev.yml up -d --force-recreate
```

## 📁 Estrutura do Projeto

```
nutz-current-20250909-195539/
├── apps/
│   ├── web/          # Frontend Next.js (porta 3000)
│   └── api/          # Backend NestJS (porta 3001)
├── config/           # Configurações
├── services/         # Docker services
├── start-dev.sh      # Script de início
├── stop-dev.sh       # Script de parada
└── docker-compose.dev.yml
```

## 🔒 Segurança

- Todas as senhas estão em `.env.local`
- JWT_SECRET é gerado automaticamente
- Banco de dados roda isolado no Docker
- APIs externas usam chaves de teste

## 🚧 Desenvolvimento

### Fazer mudanças no código
1. Edite os arquivos em `apps/web/src` ou `apps/api/src`
2. As mudanças são aplicadas automaticamente (hot reload)
3. Para mudanças no schema do banco: `npx prisma db push`

### Adicionar dependências
```bash
# Frontend
cd apps/web && pnpm add package-name

# Backend
cd apps/api && pnpm add package-name
```

### Commit e Push
```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

## 📞 Suporte

Se algo não funcionar:
1. Execute `./stop-dev.sh` primeiro
2. Aguarde 10 segundos
3. Execute `./start-dev.sh` novamente
4. Se continuar com problemas, verifique os logs

---

**Desenvolvido com 🤖 [Claude Code](https://claude.ai/code)**