# Sistema de IPs Autorizados - Guia de Uso

## Visão Geral

O sistema de IPs autorizados foi implementado para aumentar a segurança das operações de payout (USDT e PIX). Apenas IPs previamente cadastrados e ativos podem realizar operações de saque/transferência.

## Funcionalidades

### 1. Gerenciamento de IPs Autorizados

Acesse `/dashboard/api-keys` para gerenciar IPs autorizados:

- **Aba "IPs Autorizados"**: Visualize e gerencie IPs
- **Adicionar IP**: Cadastre novos IPs com descrição
- **Ativar/Desativar**: Toggle do status de IPs
- **Remover IP**: Exclua IPs desnecessários

### 2. Validação Automática

Todas as rotas de payout agora incluem validação automática de IP:

- **PIX Payout**: `/api/pix/payout`
- **USDT Payout**: `/api/usdt/payout`

### 3. Log de Segurança

Tentativas de acesso não autorizadas são registradas automaticamente.

## Como Usar

### 1. Cadastrar IPs Autorizados

1. Faça login como SUPER_ADMIN
2. Acesse `/dashboard/api-keys`
3. Clique na aba "IPs Autorizados"
4. Preencha:
   - **Endereço IP**: IP do servidor (ex: `192.168.1.100`)
   - **Descrição**: Identificação do servidor (ex: "Servidor de Produção")
5. Clique em "Adicionar IP"

### 2. Realizar Payouts

#### PIX Payout
```bash
curl -X POST http://localhost:3000/api/pix/payout \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=SEU_TOKEN" \
  -d '{
    "amount": 100.00,
    "pixKey": "user@example.com",
    "recipientName": "João Silva"
  }'
```

#### USDT Payout
```bash
curl -X POST http://localhost:3000/api/usdt/payout \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=SEU_TOKEN" \
  -d '{
    "amount": 50.000000,
    "recipientAddress": "0x1234567890abcdef...",
    "recipientName": "Cliente USDT"
  }'
```

### 3. Respostas da API

#### Sucesso
```json
{
  "success": true,
  "transaction": {
    "id": "cuid123",
    "amount": 100.00,
    "status": "PROCESSING",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "message": "Payout initiated successfully"
}
```

#### IP Não Autorizado
```json
{
  "error": "Access denied",
  "message": "This IP address is not authorized to perform payout operations"
}
```

#### Outros Erros
```json
{
  "error": "Insufficient balance"
}
```

## Detecção de IP

O sistema utiliza múltiplos métodos para detectar o IP real:

1. **X-Forwarded-For** (proxy/load balancer)
2. **X-Real-IP** 
3. **CF-Connecting-IP** (Cloudflare)
4. **X-Vercel-Forwarded-For** (Vercel)

## Segurança

### Logs de Segurança

Eventos registrados automaticamente:

- **Tentativas não autorizadas**
- **Payouts bem-sucedidos**
- **Erros de validação**

### Validações Implementadas

- ✅ Validação de formato de IP (IPv4/IPv6)
- ✅ Verificação de IP ativo na base
- ✅ Logs de tentativas não autorizadas
- ✅ Autenticação obrigatória
- ✅ Validação de saldo suficiente

## Administração

### Monitorar Atividade

Para ver logs de segurança, verifique os logs do servidor:

```bash
# Ver tentativas não autorizadas
grep "unauthorized_payout_attempt" logs/app.log

# Ver payouts bem-sucedidos
grep "payout_created" logs/app.log
```

### Backup de IPs

Para fazer backup dos IPs autorizados:

```sql
SELECT * FROM authorized_ips WHERE is_active = true;
```

### Restaurar IPs

Para restaurar IPs de um backup:

```sql
INSERT INTO authorized_ips (ip_address, description, is_active) 
VALUES ('192.168.1.100', 'Servidor Principal', true);
```

## Troubleshooting

### Problema: IP não é detectado corretamente

**Solução**: Verifique se o proxy/load balancer está enviando os headers corretos:
- `X-Forwarded-For`
- `X-Real-IP`
- `CF-Connecting-IP`

### Problema: Payout negado mesmo com IP autorizado

**Soluções**:
1. Verifique se o IP está marcado como ativo
2. Confirme se o formato do IP está correto
3. Verifique logs para ver qual IP está sendo detectado

### Problema: Não consegue adicionar IP

**Soluções**:
1. Confirme que está logado como SUPER_ADMIN
2. Verifique se o formato do IP é válido
3. Confirme que o IP não já existe

## APIs Disponíveis

### Listar IPs Autorizados
```
GET /api/admin/authorized-ips
```

### Adicionar IP
```
POST /api/admin/authorized-ips
{
  "ipAddress": "192.168.1.100",
  "description": "Servidor Principal"
}
```

### Atualizar Status
```
PATCH /api/admin/authorized-ips/{id}
{
  "isActive": false
}
```

### Remover IP
```
DELETE /api/admin/authorized-ips/{id}
```

## Exemplo de Integração

Para integrar com seu sistema, use a função utilitária:

```typescript
import { validatePayoutIP } from '@/lib/ip-validation';

export async function POST(request: NextRequest) {
  // Validar IP primeiro
  const ipValidation = await validatePayoutIP(request);
  
  if (!ipValidation.isAuthorized) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Continuar com a lógica do payout...
}
```

## Importante

- **Apenas SUPER_ADMINs** podem gerenciar IPs autorizados
- **Todos os payouts** requerem IP autorizado
- **Tentativas não autorizadas** são logadas para auditoria
- **IPs inativos** são negados automaticamente