# 🔧 NutzBeta API - Guia de Troubleshooting

## 📋 Índice

1. [Problemas de Autenticação](#-problemas-de-autenticação)
2. [Erros de Permissão (Scopes)](#-erros-de-permissão-scopes)
3. [Problemas de Rate Limiting](#-problemas-de-rate-limiting)
4. [Erros de Validação](#-erros-de-validação)
5. [Problemas de Webhooks](#-problemas-de-webhooks)
6. [Problemas de Conectividade](#-problemas-de-conectividade)
7. [Debugging Avançado](#-debugging-avançado)
8. [Códigos de Erro Comuns](#-códigos-de-erro-comuns)

---

## 🔐 Problemas de Autenticação

### ❌ Erro: "Invalid API key"

**Causa**: API key incorreta, inválida ou mal formatada.

**Soluções**:

1. **Verifique o formato da API key**:
   ```bash
   # Formato correto
   ntz_test_abc123def456...  # Ambiente de teste
   ntz_live_abc123def456...  # Ambiente de produção
   ```

2. **Verifique o header Authorization**:
   ```javascript
   // ✅ Correto
   headers: {
     'Authorization': 'Bearer ntz_test_abc123...',
     'Content-Type': 'application/json'
   }

   // ❌ Incorreto
   headers: {
     'Authorization': 'ntz_test_abc123...',  // Faltou "Bearer "
     'Content-Type': 'application/json'
   }
   ```

3. **Teste a API key**:
   ```bash
   curl -X GET http://localhost:3001/api/v1/payments/balance \
     -H "Authorization: Bearer ntz_test_..." \
     -H "Content-Type: application/json"
   ```

### ❌ Erro: "API key has expired"

**Causa**: A API key passou da data de expiração.

**Soluções**:
1. Gere uma nova API key no dashboard
2. Atualize sua aplicação com a nova key
3. Configure um sistema de rotação automática

### ❌ Erro: "API key is not active"

**Causa**: A API key foi desativada ou revogada.

**Soluções**:
1. Verifique o status no dashboard
2. Gere uma nova API key se necessário
3. Implemente logs para monitorar o status

---

## 🚫 Erros de Permissão (Scopes)

### ❌ Erro: "Insufficient permissions"

**Causa**: A API key não possui os scopes necessários para a operação.

**Diagnóstico**:
```bash
# Teste com uma API key que tem scopes limitados
curl -X POST http://localhost:3001/api/v1/payments \
  -H "Authorization: Bearer ntz_test_..." \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "BRL", "description": "teste"}'

# Resposta de erro
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "timestamp": "2025-10-12T18:13:59.256Z"
}
```

**Soluções**:

1. **Verificar scopes necessários**:
   | Endpoint | Scopes Necessários |
   |----------|-------------------|
   | `GET /payments` | `payments:read` |
   | `POST /payments` | `payments:write` |
   | `GET /payments/balance` | `payments:read` + `account:read` |

2. **Atualizar scopes da API key**:
   ```bash
   curl -X PATCH http://localhost:3000/api/keys/{key_id} \
     -H "Authorization: Bearer jwt_token..." \
     -H "Content-Type: application/json" \
     -d '{
       "action": "update_scopes",
       "scopes": ["payments:read", "payments:write", "account:read"]
     }'
   ```

3. **Usar wildcard temporariamente** (apenas para debugging):
   ```json
   {
     "scopes": ["*"]
   }
   ```

---

## ⏱️ Problemas de Rate Limiting

### ❌ Erro: "Too Many Requests"

**Causa**: Excedeu os limites de requisições por tempo.

**Limites Atuais**:
- **10 requisições por segundo**
- **300 requisições por minuto**
- **1000 requisições por hora**

**Soluções**:

1. **Implementar retry com backoff exponencial**:
   ```javascript
   async function makeRequestWithRetry(url, options, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         const response = await fetch(url, options);

         if (response.status === 429) {
           const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
           console.log(`Rate limited. Waiting ${retryAfter}s...`);
           await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
           continue;
         }

         return response;
       } catch (error) {
         if (i === maxRetries - 1) throw error;
       }
     }
   }
   ```

2. **Implementar queue de requisições**:
   ```javascript
   class APIQueue {
     constructor(maxPerSecond = 8) { // Deixar margem
       this.queue = [];
       this.processing = false;
       this.interval = 1000 / maxPerSecond;
     }

     async add(apiCall) {
       return new Promise((resolve, reject) => {
         this.queue.push({ apiCall, resolve, reject });
         this.process();
       });
     }

     async process() {
       if (this.processing || this.queue.length === 0) return;

       this.processing = true;

       while (this.queue.length > 0) {
         const { apiCall, resolve, reject } = this.queue.shift();

         try {
           const result = await apiCall();
           resolve(result);
         } catch (error) {
           reject(error);
         }

         await new Promise(resolve => setTimeout(resolve, this.interval));
       }

       this.processing = false;
     }
   }
   ```

---

## ⚠️ Erros de Validação

### ❌ Erro: "Validation failed"

**Causa**: Dados enviados não atendem aos critérios de validação.

**Erros Comuns**:

1. **Valor inválido (amount)**:
   ```javascript
   // ❌ Incorreto
   { "amount": 50 } // Menor que o mínimo (100 centavos = R$ 1,00)

   // ✅ Correto
   { "amount": 1000 } // R$ 10,00 em centavos
   ```

2. **Email inválido**:
   ```javascript
   // ❌ Incorreto
   { "customerEmail": "email-invalido" }

   // ✅ Correto
   { "customerEmail": "cliente@exemplo.com" }
   ```

3. **Campos obrigatórios ausentes**:
   ```javascript
   // ❌ Incorreto
   {
     "amount": 1000
     // Faltou description e currency
   }

   // ✅ Correto
   {
     "amount": 1000,
     "currency": "BRL",
     "description": "Compra de produto"
   }
   ```

**Debug de validação**:
```javascript
try {
  const response = await fetch('/api/v1/payments', {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    const errorData = await response.json();

    if (errorData.statusCode === 400) {
      console.error('Validation errors:', errorData.message);
      // errorData.message será um array com os erros específicos
    }
  }
} catch (error) {
  console.error('Request error:', error);
}
```

---

## 🔔 Problemas de Webhooks

### ❌ Webhook não está sendo recebido

**Diagnóstico**:

1. **Verificar URL do webhook**:
   ```bash
   # Teste se sua URL está acessível
   curl -X POST https://sua-url.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

2. **Verificar logs do webhook**:
   ```bash
   curl -X GET http://localhost:3001/api/v1/webhooks/{webhook_id}/deliveries \
     -H "Authorization: Bearer ntz_test_..."
   ```

3. **Implementar endpoint de teste**:
   ```javascript
   // Express.js
   app.post('/webhook-test', (req, res) => {
     console.log('📥 Webhook recebido:', {
       headers: req.headers,
       body: req.body,
       timestamp: new Date().toISOString()
     });

     res.status(200).json({ received: true });
   });
   ```

### ❌ Erro: "Webhook signature validation failed"

**Causa**: Falha na validação da assinatura HMAC.

**Solução**:
```javascript
const crypto = require('crypto');

function validateWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');

  const expectedHeader = `sha256=${expectedSignature}`;

  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedHeader)
  );
}

// No seu endpoint
app.post('/webhooks/payments', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-nutz-signature'];
  const payload = req.body;

  if (!validateWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  // Processar webhook...
  res.status(200).send('OK');
});
```

---

## 🌐 Problemas de Conectividade

### ❌ Erro: "Connection refused" ou "Network error"

**Diagnóstico**:

1. **Verificar se a API está rodando**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verificar DNS/conectividade**:
   ```bash
   ping localhost
   telnet localhost 3001
   ```

3. **Verificar firewall/proxy**:
   ```bash
   # Testar de diferentes locais
   curl -v http://localhost:3001/api/v1/payments
   ```

**Soluções**:

1. **Configurar timeout adequado**:
   ```javascript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s

   try {
     const response = await fetch(url, {
       ...options,
       signal: controller.signal
     });
     clearTimeout(timeoutId);
     return response;
   } catch (error) {
     if (error.name === 'AbortError') {
       throw new Error('Request timeout');
     }
     throw error;
   }
   ```

2. **Implementar circuit breaker**:
   ```javascript
   class CircuitBreaker {
     constructor(threshold = 5, timeout = 60000) {
       this.failureCount = 0;
       this.threshold = threshold;
       this.timeout = timeout;
       this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
       this.nextAttempt = Date.now();
     }

     async execute(operation) {
       if (this.state === 'OPEN') {
         if (Date.now() < this.nextAttempt) {
           throw new Error('Circuit breaker is OPEN');
         }
         this.state = 'HALF_OPEN';
       }

       try {
         const result = await operation();
         this.onSuccess();
         return result;
       } catch (error) {
         this.onFailure();
         throw error;
       }
     }

     onSuccess() {
       this.failureCount = 0;
       this.state = 'CLOSED';
     }

     onFailure() {
       this.failureCount++;
       if (this.failureCount >= this.threshold) {
         this.state = 'OPEN';
         this.nextAttempt = Date.now() + this.timeout;
       }
     }
   }
   ```

---

## 🐛 Debugging Avançado

### 1. Habilitar logs detalhados

```javascript
// Interceptador para debugging
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  console.log('🚀 Request:', args[0], args[1]);

  try {
    const response = await originalFetch.apply(this, args);
    console.log('✅ Response:', response.status, response.statusText);

    // Clonar response para conseguir ler o body
    const clonedResponse = response.clone();
    const body = await clonedResponse.text();
    console.log('📦 Response Body:', body);

    return response;
  } catch (error) {
    console.error('❌ Request Error:', error);
    throw error;
  }
};
```

### 2. Verificar estado da API

```bash
# Health check completo
curl -X GET http://localhost:3001/health

# Status específico dos serviços
curl -X GET http://localhost:3001/api/v1/payments \
  -H "Authorization: Bearer ntz_test_..." \
  -v  # Verbose para ver headers
```

### 3. Monitoramento em tempo real

```javascript
// Monitor de API calls
class APIMonitor {
  constructor() {
    this.requests = [];
    this.startTime = Date.now();
  }

  logRequest(method, url, status, duration) {
    this.requests.push({
      timestamp: Date.now(),
      method,
      url,
      status,
      duration,
      success: status >= 200 && status < 300
    });

    // Limpar logs antigos (últimas 100 requisições)
    if (this.requests.length > 100) {
      this.requests = this.requests.slice(-100);
    }
  }

  getStats() {
    const recent = this.requests.filter(req =>
      Date.now() - req.timestamp < 60000 // Último minuto
    );

    return {
      total: recent.length,
      successful: recent.filter(req => req.success).length,
      failed: recent.filter(req => !req.success).length,
      avgDuration: recent.reduce((sum, req) => sum + req.duration, 0) / recent.length || 0,
      errorRate: recent.filter(req => !req.success).length / recent.length || 0
    };
  }
}

const monitor = new APIMonitor();
```

---

## 📋 Códigos de Erro Comuns

| Código | Erro | Causa | Solução |
|--------|------|-------|---------|
| **400** | Bad Request | Dados inválidos | Verificar formato e validação |
| **401** | Unauthorized | API key inválida | Verificar autenticação |
| **403** | Forbidden | Scopes insuficientes | Verificar permissões |
| **404** | Not Found | Endpoint não existe | Verificar URL |
| **429** | Too Many Requests | Rate limit | Implementar retry |
| **500** | Internal Server Error | Erro no servidor | Verificar logs da API |
| **502** | Bad Gateway | Proxy/Load balancer | Verificar infraestrutura |
| **503** | Service Unavailable | API indisponível | Aguardar ou verificar status |

---

## 🆘 Quando Buscar Suporte

Se após seguir este guia você ainda enfrentar problemas:

1. **Colete informações**:
   - Logs completos da aplicação
   - Request/response headers
   - Timestamp dos erros
   - Ambiente (test/prod)

2. **Documente o problema**:
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Código exemplo que falha

3. **Recursos de suporte**:
   - **Documentação**: http://localhost:3001/docs
   - **Health Check**: http://localhost:3001/health
   - **Dashboard**: http://localhost:3000/dashboard

---

## 📚 Recursos Adicionais

- [Guia de Integração](/API_INTEGRATION_GUIDE.md)
- [Documentação Interativa](http://localhost:3001/docs)
- [Dashboard de API Keys](http://localhost:3000/dashboard/api-keys)

**💡 Dica**: Mantenha este guia como referência durante o desenvolvimento e teste sempre em ambiente de desenvolvimento antes de fazer deploy em produção!