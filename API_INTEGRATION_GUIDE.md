# NutzBeta Payment Gateway - Guia de Integração

## 🚀 Introdução

O NutzBeta é um gateway de pagamentos moderno e seguro que permite aos sellers integrar facilmente processamento de pagamentos em seus sistemas.

## 📋 Índice

1. [Primeiros Passos](#primeiros-passos)
2. [Autenticação](#autenticação)
3. [Criando Pagamentos](#criando-pagamentos)
4. [Webhooks](#webhooks)
5. [Exemplos de Código](#exemplos-de-código)
6. [Tratamento de Erros](#tratamento-de-erros)

---

## 🎯 Primeiros Passos

### 1. Criando sua conta

1. Acesse o dashboard em `http://localhost:3000/dashboard`
2. Faça login ou crie sua conta
3. Navegue para a seção "API Keys"

### 2. Gerando sua primeira API Key

```bash
# Exemplo via curl
curl -X POST http://localhost:3000/api/keys \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Loja Online - Produção",
    "scopes": ["payments:read", "payments:write", "webhooks:read"],
    "companyId": "minha-empresa-123"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "key": {
    "id": "cmgo0xcup0005nj5zlm4qpht5",
    "name": "Minha Loja Online - Produção",
    "key": "ntz_test_c5839a39dd91bd4bbaf512a930ab031e5d18ec0d825f67bdc51571494f898d5a",
    "prefix": "ntz_test_",
    "scopes": ["payments:read", "payments:write", "webhooks:read"],
    "expiresAt": null,
    "createdAt": "2025-10-12T18:14:32.018Z"
  },
  "message": "API key created successfully"
}
```

⚠️ **IMPORTANTE**: Salve a `key` imediatamente! Ela só é mostrada uma vez por motivos de segurança.

---

## 🔐 Autenticação

Todas as requisições à API devem incluir o header de autorização:

```
Authorization: Bearer ntz_test_c5839a39dd91bd4bbaf512a930ab031e5d18ec0d825f67bdc51571494f898d5a
```

### Tipos de API Key

- **Test Keys**: `ntz_test_*` - Para desenvolvimento
- **Live Keys**: `ntz_live_*` - Para produção

### Scopes (Permissões)

| Scope | Descrição |
|-------|-----------|
| `payments:read` | Ler informações de pagamentos |
| `payments:write` | Criar novos pagamentos |
| `webhooks:read` | Ler configurações de webhooks |
| `webhooks:write` | Configurar webhooks |
| `account:read` | Ler informações da conta |
| `*` | Acesso completo ⚠️ |

---

## 💳 Criando Pagamentos

### Endpoint Base
```
POST /api/v1/payments
```

### Exemplo Completo

```javascript
const payment = await fetch('http://localhost:3001/api/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ntz_test_c5839a39dd91bd4bbaf512a930ab031e5d18ec0d825f67bdc51571494f898d5a',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 15000, // R$ 150.00 em centavos
    currency: 'BRL',
    description: 'Compra de produto XYZ',
    customerEmail: 'cliente@exemplo.com'
  })
});

const result = await payment.json();
console.log(result);
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "pay_1760292879706",
    "amount": 15000,
    "currency": "BRL",
    "description": "Compra de produto XYZ",
    "customerEmail": "cliente@exemplo.com",
    "status": "pending",
    "createdAt": "2025-10-12T18:14:39.706Z"
  },
  "message": "Payment created successfully",
  "requestedBy": {
    "keyId": "cmgo0xcup0005nj5zlm4qpht5",
    "keyName": "Full Access Payment Key",
    "scopes": ["*"]
  }
}
```

### Consultando Pagamentos

```javascript
// Listar todos os pagamentos
const payments = await fetch('http://localhost:3001/api/v1/payments', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});
```

### Consultando Saldo

```javascript
// Requer scopes: payments:read + account:read
const balance = await fetch('http://localhost:3001/api/v1/payments/balance', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "available": 150000,
    "pending": 25000,
    "currency": "BRL",
    "lastUpdated": "2025-10-12T18:15:18.009Z"
  },
  "message": "Balance retrieved successfully"
}
```

---

## 🔔 Webhooks

Configure webhooks para receber notificações em tempo real:

```javascript
// Listar webhooks configurados
const webhooks = await fetch('http://localhost:3001/api/v1/payments/webhooks', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});
```

---

## 💻 Exemplos de Código

### Node.js / JavaScript

```javascript
class NutzPayments {
  constructor(apiKey, baseUrl = 'http://localhost:3001/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async createPayment(paymentData) {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Payment failed: ${error.message}`);
    }

    return await response.json();
  }

  async getPayments() {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }

  async getBalance() {
    const response = await fetch(`${this.baseUrl}/payments/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return await response.json();
  }
}

// Uso
const nutz = new NutzPayments('ntz_test_...');

try {
  const payment = await nutz.createPayment({
    amount: 10000,
    currency: 'BRL',
    description: 'Compra teste',
    customerEmail: 'cliente@teste.com'
  });

  console.log('Pagamento criado:', payment);
} catch (error) {
  console.error('Erro:', error.message);
}
```

### PHP

```php
<?php
class NutzPayments {
    private $apiKey;
    private $baseUrl;

    public function __construct($apiKey, $baseUrl = 'http://localhost:3001/api/v1') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }

    public function createPayment($paymentData) {
        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->baseUrl . '/payments',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $this->apiKey,
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode($paymentData)
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($httpCode >= 400) {
            throw new Exception('Payment failed: ' . $response);
        }

        return json_decode($response, true);
    }
}

// Uso
$nutz = new NutzPayments('ntz_test_...');

try {
    $payment = $nutz->createPayment([
        'amount' => 10000,
        'currency' => 'BRL',
        'description' => 'Compra teste',
        'customerEmail' => 'cliente@teste.com'
    ]);

    echo 'Pagamento criado: ' . json_encode($payment);
} catch (Exception $e) {
    echo 'Erro: ' . $e->getMessage();
}
?>
```

### Python

```python
import requests
import json

class NutzPayments:
    def __init__(self, api_key, base_url='http://localhost:3001/api/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }

    def create_payment(self, payment_data):
        response = requests.post(
            f'{self.base_url}/payments',
            headers=self.headers,
            json=payment_data
        )

        if response.status_code >= 400:
            raise Exception(f'Payment failed: {response.text}')

        return response.json()

    def get_payments(self):
        response = requests.get(
            f'{self.base_url}/payments',
            headers=self.headers
        )
        return response.json()

# Uso
nutz = NutzPayments('ntz_test_...')

try:
    payment = nutz.create_payment({
        'amount': 10000,
        'currency': 'BRL',
        'description': 'Compra teste',
        'customerEmail': 'cliente@teste.com'
    })

    print('Pagamento criado:', json.dumps(payment, indent=2))
except Exception as e:
    print('Erro:', str(e))
```

---

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Dados inválidos |
| `401` | API key inválida ou ausente |
| `403` | Permissões insuficientes (scopes) |
| `404` | Recurso não encontrado |
| `429` | Rate limit excedido |
| `500` | Erro interno do servidor |

### Exemplo de Resposta de Erro

```json
{
  "statusCode": 403,
  "timestamp": "2025-10-12T18:13:59.256Z",
  "path": "/api/v1/payments",
  "method": "POST",
  "requestId": "61139459-c42a-4012-95f8-68cd8e0c598b",
  "message": "Insufficient permissions"
}
```

### Tratamento Robusto

```javascript
async function handleNutzApiCall(apiCall) {
  try {
    const response = await apiCall();

    if (!response.ok) {
      const error = await response.json();

      switch (response.status) {
        case 401:
          throw new Error('API key inválida. Verifique suas credenciais.');
        case 403:
          throw new Error('Permissões insuficientes. Verifique os scopes da sua API key.');
        case 429:
          throw new Error('Rate limit excedido. Aguarde um momento antes de tentar novamente.');
        default:
          throw new Error(error.message || 'Erro desconhecido');
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na chamada da API:', error.message);
    throw error;
  }
}
```

---

## 📞 Suporte

- **Documentação Interativa**: http://localhost:3001/docs
- **Health Check**: http://localhost:3001/health
- **Dashboard**: http://localhost:3000/dashboard

---

## ✅ Checklist de Integração

- [ ] API key criada com scopes adequados
- [ ] Teste de autenticação funcionando
- [ ] Primeiro pagamento criado com sucesso
- [ ] Tratamento de erros implementado
- [ ] Webhooks configurados (se necessário)
- [ ] Monitoramento de rate limits implementado
- [ ] Logs de transações configurados
- [ ] Teste em ambiente de produção

---

**🎉 Parabéns! Sua integração com o NutzBeta está completa!**