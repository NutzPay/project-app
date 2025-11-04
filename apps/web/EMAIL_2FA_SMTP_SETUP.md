# Sistema de Email & 2FA com SMTP - Nutzpay

## ✅ Arquitetura

**Desenvolvimento:** Mailhog (SMTP local via Docker)
**Produção:** Qualquer servidor SMTP (Gmail, Outlook, SendGrid, servidor próprio)

## 🚀 Setup Rápido - Desenvolvimento

### 1. Iniciar Mailhog

```bash
# Na raiz do projeto
docker-compose -f docker-compose.mail.yml up -d
```

Mailhog estará rodando em:
- **SMTP Server:** `localhost:1025`
- **Web UI:** http://localhost:8025 (para ver os e-mails)

### 2. Configurar variáveis de ambiente

Criar/atualizar `.env.local`:

```env
# SMTP Configuration - Development (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM_EMAIL=Nutzpay <noreply@nutzpay.com>

# No need for SMTP_USER and SMTP_PASS in development with Mailhog
# SMTP_SECURE is automatically false in development

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Aplicar migration

```bash
cd apps/web
npx prisma db push
npx prisma generate
```

### 4. Testar

```bash
npm run dev
```

Acesse http://localhost:8025 para ver os e-mails que o sistema enviar!

## 🏭 Setup Produção

### Opção 1: Gmail SMTP

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM_EMAIL=Nutzpay <seu-email@gmail.com>
```

**Importante:** Usar senha de app, não a senha normal do Gmail.
Como criar: https://support.google.com/accounts/answer/185833

### Opção 2: Outlook/Office365 SMTP

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha
SMTP_FROM_EMAIL=Nutzpay <seu-email@outlook.com>
```

### Opção 3: Servidor SMTP Próprio

```env
SMTP_HOST=mail.seudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@seudominio.com
SMTP_PASS=senha-forte
SMTP_FROM_EMAIL=Nutzpay <noreply@seudominio.com>
```

### Opção 4: SendGrid SMTP

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
SMTP_FROM_EMAIL=Nutzpay <noreply@seudominio.com>
```

## 📋 Arquivos Criados

```
apps/web/src/lib/email/
├── smtp.ts                 # Cliente SMTP com Nodemailer
├── templates.ts            # Templates HTML dos e-mails
└── email-service.ts        # Lógica de negócio

docker-compose.mail.yml     # Mailhog para desenvolvimento
```

## 🔐 Funcionalidades

### 1. Verificação de E-mail
- E-mail enviado automaticamente no registro
- Link válido por 24 horas
- E-mail também enviado após aprovação do admin

### 2. 2FA Obrigatório
- Código de 6 dígitos enviado por e-mail
- Válido por 10 minutos
- **Código Master:** `865911` (bypass para dev/emergência)

### 3. E-mail de Aprovação
- Enviado quando admin aprova seller PENDING
- Contém link para login

## 🧪 Como Testar

### Teste 1: Verificação de E-mail no Registro

1. Registrar nova conta em http://localhost:3000/auth/register
2. Ver e-mail em http://localhost:8025
3. Clicar no link de verificação
4. Conta fica verificada

### Teste 2: 2FA no Login

1. Fazer login com conta verificada
2. Sistema envia código por e-mail
3. Ver código em http://localhost:8025
4. Inserir código (ou usar `865911`)
5. Acesso liberado

### Teste 3: Aprovação de Seller

1. Admin acessa backoffice
2. Aprova seller PENDING
3. Seller recebe e-mail de aprovação
4. Ver e-mail em http://localhost:8025

## 🛠️ Comandos Úteis

### Iniciar Mailhog
```bash
docker-compose -f docker-compose.mail.yml up -d
```

### Parar Mailhog
```bash
docker-compose -f docker-compose.mail.yml down
```

### Ver logs do Mailhog
```bash
docker-compose -f docker-compose.mail.yml logs -f
```

### Testar conexão SMTP
```typescript
import { testSMTPConnection } from '@/lib/email/smtp';

const result = await testSMTPConnection();
console.log(result); // { success: true } ou { success: false, error: '...' }
```

## 📝 Próximos Passos

Ver arquivo `EMAIL_2FA_IMPLEMENTATION.md` para:
- [ ] Criar rotas de API
- [ ] Modificar login/registro
- [ ] Criar páginas de UI
- [ ] Integrar com aprovação de sellers

## 🔍 Troubleshooting

### E-mails não aparecem no Mailhog
```bash
# Verificar se Mailhog está rodando
docker ps | grep mailhog

# Ver logs
docker-compose -f docker-compose.mail.yml logs mailhog
```

### Erro de conexão SMTP em produção
- Verificar credenciais no `.env`
- Verificar firewall/porta bloqueada
- Gmail: usar senha de app, não senha normal
- Testar com comando: `telnet smtp.gmail.com 587`

### E-mails indo para spam
- Configurar SPF/DKIM/DMARC do domínio
- Usar domínio próprio, não Gmail/Outlook
- Considerar usar serviço dedicado (SendGrid, Mailgun)

## 💡 Dicas

1. **Desenvolvimento:** Sempre use Mailhog
2. **Produção:** Use servidor SMTP dedicado ou SendGrid
3. **Código Master:** Remover em produção
4. **Logs:** Todos os envios são logados no console
5. **Preview:** Mailhog mostra e-mails renderizados perfeitamente
