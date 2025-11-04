import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody, ApiParam } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../api-keys/decorators/scopes.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('ApiKeyAuth')
export class WebhooksDocsController {

  @Get()
  @RequireScopes('webhooks:read')
  @ApiOperation({
    summary: '🔔 Listar webhooks configurados',
    description: `
### 🔔 Webhooks

Liste todos os webhooks configurados para sua conta.

**Scopes necessários:** \`webhooks:read\`

#### 📡 O que são Webhooks?
Webhooks são notificações HTTP que enviamos para sua aplicação quando eventos importantes acontecem:
- Pagamento confirmado
- Pagamento falhou
- Saldo atualizado
- Chargeback recebido

#### 📱 Exemplo de uso:
\`\`\`javascript
const response = await fetch('/api/v1/webhooks', {
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();
console.log('Webhooks configurados:', data);
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Webhooks recuperados com sucesso',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: 'wh_abc123',
            url: 'https://minha-loja.com/webhooks/payments',
            events: ['payment.completed', 'payment.failed', 'payment.pending'],
            active: true,
            secret: 'whsec_...',
            createdAt: '2025-10-12T10:30:00.000Z',
            lastDelivery: {
              timestamp: '2025-10-12T18:00:00.000Z',
              status: 'success',
              responseCode: 200,
              attempts: 1
            }
          }
        ],
        message: 'Webhooks retrieved successfully'
      }
    }
  })
  async getWebhooks(@Request() req?: any) {
    const apiKey = req.apiKey;

    return {
      success: true,
      data: [
        {
          id: 'wh_abc123',
          url: 'https://minha-loja.com/webhooks/payments',
          events: ['payment.completed', 'payment.failed', 'payment.pending'],
          active: true,
          secret: 'whsec_1234567890abcdef',
          createdAt: new Date(),
          lastDelivery: {
            timestamp: new Date(),
            status: 'success',
            responseCode: 200,
            attempts: 1
          }
        }
      ],
      message: 'Webhooks retrieved successfully',
      requestedBy: {
        keyId: apiKey.id,
        keyName: apiKey.name,
        scopes: apiKey.scopes,
      }
    };
  }

  @Post()
  @RequireScopes('webhooks:write')
  @ApiOperation({
    summary: '🔧 Criar novo webhook',
    description: `
### 🔧 Criar Webhook

Configure um novo webhook para receber notificações.

**Scopes necessários:** \`webhooks:write\`

#### 🛡️ Validação de Segurança
Toda requisição webhook inclui:
- **Signature Header**: \`X-Nutz-Signature\` com HMAC-SHA256
- **Timestamp Header**: \`X-Nutz-Timestamp\` para evitar replay attacks
- **User-Agent**: \`NutzBeta-Webhook/1.0\`

#### 🔍 Como validar o webhook:
\`\`\`javascript
const crypto = require('crypto');

function validateWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return \`sha256=\${expectedSignature}\` === signature;
}

// No seu endpoint:
app.post('/webhooks/payments', (req, res) => {
  const signature = req.headers['x-nutz-signature'];
  const payload = JSON.stringify(req.body);

  if (!validateWebhook(payload, signature, 'seu_webhook_secret')) {
    return res.status(401).send('Invalid signature');
  }

  // Processar o evento...
  console.log('Evento:', req.body.type);
  res.status(200).send('OK');
});
\`\`\`
    `,
  })
  @ApiBody({
    description: 'Configuração do webhook',
    examples: {
      basico: {
        summary: '🔔 Webhook Básico',
        description: 'Configuração simples para pagamentos',
        value: {
          url: 'https://minha-loja.com/webhooks/payments',
          events: ['payment.completed', 'payment.failed']
        }
      },
      completo: {
        summary: '🔔 Webhook Completo',
        description: 'Configuração avançada com todos os eventos',
        value: {
          url: 'https://api.minha-empresa.com/webhooks/nutzbeta',
          events: [
            'payment.pending',
            'payment.processing',
            'payment.completed',
            'payment.failed',
            'payment.cancelled',
            'payment.refunded',
            'balance.updated',
            'chargeback.created'
          ],
          description: 'Webhook principal da loja online'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '✅ Webhook criado com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          id: 'wh_def456',
          url: 'https://minha-loja.com/webhooks/payments',
          events: ['payment.completed', 'payment.failed'],
          active: true,
          secret: 'whsec_new_generated_secret_key',
          createdAt: '2025-10-12T18:30:00.000Z'
        },
        message: 'Webhook created successfully'
      }
    }
  })
  async createWebhook(
    @Body() webhookData: {
      url: string;
      events: string[];
      description?: string;
    },
    @Request() req?: any
  ) {
    const apiKey = req.apiKey;

    // Simulate webhook creation
    const webhook = {
      id: `wh_${Date.now()}`,
      ...webhookData,
      active: true,
      secret: `whsec_${Math.random().toString(36).substr(2, 20)}`,
      createdAt: new Date(),
    };

    return {
      success: true,
      data: webhook,
      message: 'Webhook created successfully',
      requestedBy: {
        keyId: apiKey.id,
        keyName: apiKey.name,
        scopes: apiKey.scopes,
      }
    };
  }

  @Get('events')
  @RequireScopes('webhooks:read')
  @ApiOperation({
    summary: '📋 Listar eventos disponíveis',
    description: `
### 📋 Eventos de Webhook

Lista todos os tipos de eventos que você pode receber via webhook.

#### 💳 Eventos de Pagamento:
- \`payment.pending\` - Pagamento criado, aguardando processamento
- \`payment.processing\` - Pagamento sendo processado
- \`payment.completed\` - Pagamento confirmado com sucesso
- \`payment.failed\` - Pagamento falhou ou foi rejeitado
- \`payment.cancelled\` - Pagamento cancelado pelo cliente
- \`payment.refunded\` - Pagamento estornado

#### 💰 Eventos de Conta:
- \`balance.updated\` - Saldo da conta foi atualizado
- \`withdrawal.completed\` - Saque processado com sucesso
- \`withdrawal.failed\` - Saque falhou

#### ⚠️ Eventos de Disputa:
- \`chargeback.created\` - Chargeback iniciado
- \`chargeback.resolved\` - Chargeback resolvido

#### 📊 Payload de exemplo:
\`\`\`json
{
  "id": "evt_abc123",
  "type": "payment.completed",
  "data": {
    "payment": {
      "id": "pay_def456",
      "amount": 10000,
      "currency": "BRL",
      "status": "completed",
      "customer": {
        "email": "cliente@exemplo.com",
        "name": "João Silva"
      }
    }
  },
  "created": "2025-10-12T18:30:00.000Z"
}
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos disponíveis',
    schema: {
      example: {
        success: true,
        data: {
          payment: [
            'payment.pending',
            'payment.processing',
            'payment.completed',
            'payment.failed',
            'payment.cancelled',
            'payment.refunded'
          ],
          account: [
            'balance.updated',
            'withdrawal.completed',
            'withdrawal.failed'
          ],
          disputes: [
            'chargeback.created',
            'chargeback.resolved'
          ]
        },
        message: 'Available webhook events'
      }
    }
  })
  async getWebhookEvents() {
    return {
      success: true,
      data: {
        payment: [
          'payment.pending',
          'payment.processing',
          'payment.completed',
          'payment.failed',
          'payment.cancelled',
          'payment.refunded'
        ],
        account: [
          'balance.updated',
          'withdrawal.completed',
          'withdrawal.failed'
        ],
        disputes: [
          'chargeback.created',
          'chargeback.resolved'
        ]
      },
      message: 'Available webhook events'
    };
  }

  @Delete(':id')
  @RequireScopes('webhooks:write')
  @ApiOperation({
    summary: '🗑️ Remover webhook',
    description: 'Remove um webhook configurado. Esta ação é irreversível.'
  })
  @ApiParam({
    name: 'id',
    description: 'ID do webhook',
    example: 'wh_abc123'
  })
  @ApiResponse({
    status: 200,
    description: '✅ Webhook removido com sucesso'
  })
  async deleteWebhook(@Param('id') id: string) {
    return {
      success: true,
      message: 'Webhook deleted successfully'
    };
  }
}