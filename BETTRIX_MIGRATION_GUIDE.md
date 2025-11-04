# Guia de Migração PIX - Starkbank para Bettrix

Este documento descreve como migrar da integração PIX atual (Starkbank) para a nova API Bettrix.

## 📋 Resumo da Migração

### Endpoints Implementados

| Funcionalidade | Endpoint Anterior | Novo Endpoint Bettrix |
|----------------|------------------|----------------------|
| **Criar PIX** | `/api/starkbank/pix/create` | `/api/bettrix/pix/create` |
| **Payout PIX** | `/api/pix/payout` | `/api/bettrix/pix/payout` |
| **Saldo PIX** | `/api/pix/balance` | `/api/bettrix/pix/balance` |
| **Webhook** | `/api/starkbank/pix-webhook` | `/api/bettrix/webhook` |

### Arquivos Criados

1. **`/lib/bettrix.ts`** - Serviço principal de integração com a API Bettrix
2. **`/api/bettrix/pix/create/route.ts`** - Endpoint para criar PIX (Cash-In)
3. **`/api/bettrix/pix/payout/route.ts`** - Endpoint para saque PIX (Cash-Out)
4. **`/api/bettrix/pix/balance/route.ts`** - Endpoint para consultar saldo
5. **`/api/bettrix/webhook/route.ts`** - Webhook para receber notificações da Bettrix

## 🔑 Configuração da API Key

A API Key da Bettrix está configurada diretamente no código:
```typescript
const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';
```

**⚠️ Recomendação de Segurança:** Mova esta chave para uma variável de ambiente:
```bash
# .env.local
BETTRIX_API_KEY=u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi
```

## 🔄 Como Fazer a Migração

### 1. Atualize o Frontend

Substitua as chamadas dos endpoints antigos pelos novos:

```typescript
// Antes (Starkbank)
const response = await fetch('/api/starkbank/pix/create', {
  method: 'POST',
  body: JSON.stringify(pixData)
});

// Depois (Bettrix)
const response = await fetch('/api/bettrix/pix/create', {
  method: 'POST',
  body: JSON.stringify(pixData)
});
```

### 2. Configure Webhooks no Dashboard Bettrix

1. Acesse o dashboard da Bettrix
2. Vá em **Settings → Webhooks**
3. Configure a URL: `https://seudominio.com/api/bettrix/webhook`

### 3. Teste a Integração

Use os novos endpoints para testar:

```bash
# Criar PIX
curl -X POST https://seudominio.com/api/bettrix/pix/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "amount": 10.50,
    "name": "João Silva",
    "taxId": "12345678901",
    "description": "Depósito teste"
  }'

# Consultar Saldo
curl -X GET https://seudominio.com/api/bettrix/pix/balance \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🆚 Principais Diferenças

### Bettrix vs Starkbank

| Aspecto | Starkbank | Bettrix |
|---------|-----------|---------|
| **Endpoints** | Únicos para PIX | Cash-In / Cash-Out separados |
| **Valores** | Em reais (float) | Em centavos (integer) |
| **Status** | String livre | Enum padronizado (0-4) |
| **Webhook** | Formato específico | Formato JSON estruturado |

### Mapeamento de Status

| Bettrix | Status Interno | Descrição |
|---------|----------------|-----------|
| `0` / `pending` / `created` | `pending` | Aguardando pagamento |
| `1` / `paid` | `completed` | Pagamento confirmado |
| `2` / `failed` | `failed` | Pagamento falhou |
| `3` / `canceled` | `cancelled` | Pagamento cancelado |
| `4` / `refund` | `cancelled` | Pagamento estornado |

## 📊 Recursos da Bettrix

### Saldo Detalhado
A Bettrix fornece informações mais detalhadas sobre o saldo:
- **balance**: Saldo bruto disponível
- **retention**: Valor em retenção
- **toAnticipate**: Valor para antecipar
- **finalBalance**: Saldo líquido final

### Split de Transações
Suporte nativo para divisão de transações:
```typescript
splits: [
  {
    clientId: "uuid-do-cliente",
    value: 500 // Em centavos
  }
]
```

### Tipos de Chave PIX
Detecção automática do tipo de chave PIX:
- CPF (11 dígitos)
- CNPJ (14 dígitos)
- Email (formato email)
- Telefone (10-13 dígitos)
- Chave aleatória (outros formatos)

## 🔒 Segurança

### Validação de IP
O endpoint de payout mantém a validação de IP existente através da função `validatePayoutIP()`.

### Logs de Auditoria
Todos os eventos são logados com detalhes de segurança:
- IP autorizado
- ID do usuário
- Timestamp da operação
- Dados parcialmente ofuscados

## 🐞 Tratamento de Erros

### Fallback de Saldo
Se a API Bettrix estiver indisponível, o sistema faz fallback para o saldo local:
```typescript
{
  "provider": "local",
  "warning": "Using local balance due to Bettrix API unavailability"
}
```

### Logs Detalhados
Todos os erros são logados com contexto completo para facilitar o debugging.

## 🚀 Próximos Passos

1. **Teste em ambiente de desenvolvimento**
2. **Configure as variáveis de ambiente**
3. **Atualize o frontend para usar os novos endpoints**
4. **Configure o webhook no dashboard da Bettrix**
5. **Faça deploy em produção**
6. **Monitore os logs durante a migração**

## 📞 Suporte

Para dúvidas sobre a integração Bettrix, consulte:
- [Documentação oficial da API](https://docs.bettrix.com)
- Dashboard Bettrix: Settings → API Credentials
- Webhook logs: Dashboard → Webhooks → Logs

---

**Data da migração:** $(date)
**Responsável:** Equipe de Desenvolvimento Nutz