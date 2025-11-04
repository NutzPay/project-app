# Início Rápido

Bem-vindo ao NutzBeta! Este guia te ajudará a começar rapidamente com nossa API de pagamentos.

## 🚀 Criando sua primeira API Key

1. **Acesse o Dashboard**: http://localhost:3000
2. **Faça login** com suas credenciais
3. **Navegue** até "API Keys" no menu lateral
4. **Clique** em "Nova API Key"
5. **Configure** nome, escopos e restrições de IP (opcional)
6. **Copie** a chave gerada - ela será mostrada apenas uma vez!

:::warning Importante
Sua API key será exibida apenas uma vez por questões de segurança. Certifique-se de salvá-la em local seguro.
:::

## 🔑 Autenticação

Use sua API key no header `Authorization`:

```bash
curl -H "Authorization: NutzKey ntz_test_sua_chave_aqui" \
     https://api.nutzbeta.com/api/v1/companies
```

### Formatos de API Key

- **Teste**: `ntz_test_...` (para desenvolvimento)
- **Produção**: `ntz_live_...` (para ambiente de produção)

## 📝 Primeira Requisição

Teste sua configuração listando informações da sua empresa:

```bash
curl -X GET \
  -H "Authorization: NutzKey ntz_test_sua_chave_aqui" \
  -H "Content-Type: application/json" \
  https://api.nutzbeta.com/api/v1/companies/me
```

Resposta esperada:

```json
{
  "id": "company_123",
  "name": "Sua Empresa LTDA",
  "status": "ACTIVE",
  "plan": {
    "name": "Professional",
    "monthlyLimit": 100000.00
  }
}
```

## 🔐 Escopos e Permissões

As API keys usam um sistema de escopos granulares:

| Escopo | Descrição |
|--------|-----------|
| `payments:read` | Ler informações de pagamentos |
| `payments:write` | Criar e alterar pagamentos |
| `webhooks:*` | Acesso total aos webhooks |
| `webhooks:read` | Apenas leitura de webhooks |
| `companies:read` | Ler dados da empresa |

### Exemplos de Escopos

```json
// Acesso total
["*"]

// Apenas pagamentos
["payments:read", "payments:write"]

// Somente leitura
["payments:read", "companies:read", "webhooks:read"]
```

## 🪝 Configurando Webhooks

Os webhooks permitem receber notificações em tempo real:

```bash
curl -X POST \
  -H "Authorization: NutzKey ntz_test_sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://sua-app.com/webhooks/nutzbeta",
    "events": ["payment.created", "payment.completed"],
    "maxRetries": 3
  }' \
  https://api.nutzbeta.com/api/v1/webhooks
```

:::tip Validação de Assinatura
Sempre valide a assinatura HMAC dos webhooks usando o secret fornecido. Veja [Guia de Webhooks](/webhooks) para detalhes.
:::

## 🌐 SDKs Disponíveis

### Node.js

```bash
npm install @nutzbeta/sdk
```

```javascript
import { NutzBeta } from '@nutzbeta/sdk';

const nutzbeta = new NutzBeta('ntz_test_sua_chave_aqui');

const company = await nutzbeta.companies.me();
console.log(company);
```

### Python

```bash
pip install nutzbeta-python
```

```python
from nutzbeta import NutzBeta

nutzbeta = NutzBeta('ntz_test_sua_chave_aqui')

company = nutzbeta.companies.me()
print(company)
```

## 🔒 Segurança

### Rate Limits

- **Padrão**: 300 requisições por minuto
- **Burst**: 10 requisições por segundo
- **Headers** de resposta indicam limites restantes

### IP Whitelist

Configure IPs permitidos na criação da API key:

```json
{
  "name": "API Key Produção",
  "scopes": ["payments:*"],
  "ipWhitelist": ["192.168.1.100", "10.0.0.5"]
}
```

### Rotação de Chaves

Rotacione chaves regularmente por segurança:

```bash
curl -X POST \
  -H "Authorization: NutzKey ntz_test_chave_atual" \
  https://api.nutzbeta.com/api/v1/api-keys/{key_id}/rotate
```

## 🏦 Integração Stark Bank

O NutzBeta oferece integração nativa com Stark Bank:

1. **Configure** credenciais no dashboard
2. **Teste** conexão no ambiente sandbox
3. **Configure** webhooks para eventos Stark Bank
4. **Monitore** transações em tempo real

Veja [Guia de Integração Stark Bank](/integrations/starkbank) para detalhes.

## 📊 Monitoramento

### Logs de Auditoria

Todas as ações são registradas:

```bash
curl -H "Authorization: NutzKey ntz_test_sua_chave_aqui" \
     https://api.nutzbeta.com/api/v1/audit?limit=50
```

### Relatórios de Uso

Monitore uso de API keys:

```bash
curl -H "Authorization: NutzKey ntz_test_sua_chave_aqui" \
     https://api.nutzbeta.com/api/v1/api-keys/{key_id}/usage
```

## 📞 Próximos Passos

- [📖 Referência completa da API](/api)
- [🪝 Guia detalhado de Webhooks](/webhooks)
- [🔧 SDKs e bibliotecas](/sdks)
- [🏦 Integração Stark Bank](/integrations/starkbank)
- [💬 Canal de suporte](mailto:suporte@nutzbeta.com)

## 🆘 Precisa de Ajuda?

- **Documentação**: Explore os tópicos no menu lateral
- **Exemplos**: Confira nosso [repositório no GitHub](https://github.com/nutzbeta/examples)
- **Suporte**: [suporte@nutzbeta.com](mailto:suporte@nutzbeta.com)
- **Issues**: [GitHub Issues](https://github.com/nutzbeta/nutzbeta/issues)