import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { ApiKeyAuthGuard } from '../api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../api-keys/decorators/scopes.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto, PaymentListResponseDto, BalanceResponseDto } from './dto/payment-response.dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('ApiKeyAuth')
export class PaymentsController {

  @Get()
  @RequireScopes('payments:read')
  @ApiOperation({
    summary: 'Listar todos os pagamentos',
    description: `
### 📋 Listar Pagamentos

Retorna uma lista paginada de todos os pagamentos criados.

**Scopes necessários:** \`payments:read\`

**Exemplo de uso:**
\`\`\`javascript
const response = await fetch('/api/v1/payments', {
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});
\`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagamentos recuperada com sucesso',
    type: PaymentListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'API key inválida ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid API key',
        timestamp: '2025-10-12T18:13:59.256Z'
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Permissões insuficientes - scope payments:read necessário',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        timestamp: '2025-10-12T18:13:59.256Z'
      }
    }
  })
  async getPayments(@Request() req?: any) {
    const apiKey = req.apiKey;

    return {
      success: true,
      data: [
        {
          id: 'pay_123',
          amount: 10000, // R$ 100.00 em centavos
          currency: 'BRL',
          status: 'completed',
          description: 'Test payment',
          createdAt: new Date(),
        },
        {
          id: 'pay_124',
          amount: 5000, // R$ 50.00 em centavos
          currency: 'BRL',
          status: 'pending',
          description: 'Another test payment',
          createdAt: new Date(),
        }
      ],
      message: 'Payments retrieved successfully',
      requestedBy: {
        keyId: apiKey.id,
        keyName: apiKey.name,
        scopes: apiKey.scopes,
      }
    };
  }

  @Post()
  @RequireScopes('payments:write')
  @ApiOperation({
    summary: '💳 Criar novo pagamento',
    description: `
### 🚀 Criar Pagamento

Cria um novo pagamento no sistema. Este é o endpoint principal para processar transações.

**Scopes necessários:** \`payments:write\`

#### 💡 Dicas importantes:
- **Valores em centavos**: Sempre envie valores em centavos (ex: 10000 = R$ 100,00)
- **Idempotência**: Use o mesmo \`externalId\` para evitar pagamentos duplicados
- **Webhooks**: Configure callbacks para receber notificações de status
- **PIX**: Para PIX, você receberá \`qrCode\` e \`pixCode\` na resposta

#### 📱 Exemplo prático:
\`\`\`javascript
// Criando um pagamento de R$ 149,90
const payment = await fetch('/api/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 14990, // R$ 149,90 em centavos
    currency: 'BRL',
    description: 'Tênis Nike Air Max - Pedido #1234',
    customerEmail: 'joao@exemplo.com',
    customerName: 'João Silva',
    method: 'pix',
    externalId: 'pedido-1234',
    callbackUrl: 'https://minha-loja.com/webhooks/payments',
    metadata: {
      produto_id: 'nike-air-max-123',
      categoria: 'calcados',
      vendedor_id: '456'
    }
  })
});
\`\`\`

#### 🔄 Fluxo de pagamento:
1. **Criar** - Pagamento criado com status \`pending\`
2. **Processar** - Cliente paga via PIX/cartão
3. **Confirmar** - Status muda para \`completed\`
4. **Webhook** - Você recebe notificação na sua URL
    `,
  })
  @ApiBody({
    type: CreatePaymentDto,
    description: 'Dados do pagamento a ser criado',
    examples: {
      pix_basico: {
        summary: '🔵 PIX Básico',
        description: 'Exemplo simples de pagamento via PIX',
        value: {
          amount: 10000,
          currency: 'BRL',
          description: 'Compra de produto XYZ',
          customerEmail: 'cliente@exemplo.com',
          method: 'pix'
        }
      },
      pix_completo: {
        summary: '🔵 PIX Completo',
        description: 'Exemplo completo com todos os campos',
        value: {
          amount: 14990,
          currency: 'BRL',
          description: 'Tênis Nike Air Max - Pedido #1234',
          customerEmail: 'joao@exemplo.com',
          customerName: 'João Silva',
          customerDocument: '12345678901',
          method: 'pix',
          externalId: 'pedido-1234',
          callbackUrl: 'https://minha-loja.com/webhooks/payments',
          metadata: {
            produto_id: 'nike-air-max-123',
            categoria: 'calcados'
          }
        }
      },
      cartao: {
        summary: '💳 Cartão de Crédito',
        description: 'Exemplo de pagamento com cartão',
        value: {
          amount: 25000,
          currency: 'BRL',
          description: 'Smartphone Samsung Galaxy - Pedido #5678',
          customerEmail: 'maria@exemplo.com',
          customerName: 'Maria Santos',
          method: 'credit_card',
          externalId: 'pedido-5678'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: '✅ Pagamento criado com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          id: 'pay_1760292879706',
          amount: 10000,
          currency: 'BRL',
          status: 'pending',
          description: 'Compra de produto XYZ',
          customerEmail: 'cliente@exemplo.com',
          method: 'pix',
          paymentUrl: 'https://checkout.nutzbeta.com/pay/abc123',
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          pixCode: '00020126580014br.gov.bcb.pix013...',
          createdAt: '2025-10-12T18:14:39.706Z'
        },
        message: 'Payment created successfully'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '❌ Dados inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['Amount deve ser um número', 'Description é obrigatória'],
        error: 'Bad Request',
        timestamp: '2025-10-12T18:13:59.256Z'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '🔐 API key inválida ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid API key',
        timestamp: '2025-10-12T18:13:59.256Z'
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '🚫 Permissões insuficientes - scope payments:write necessário',
    schema: {
      example: {
        statusCode: 403,
        message: 'Insufficient permissions',
        timestamp: '2025-10-12T18:13:59.256Z'
      }
    }
  })
  async createPayment(
    @Body() paymentData: CreatePaymentDto,
    @Request() req?: any
  ) {
    const apiKey = req.apiKey;

    // Simulate payment creation
    const payment = {
      id: `pay_${Date.now()}`,
      ...paymentData,
      status: 'pending',
      createdAt: new Date(),
    };

    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
      requestedBy: {
        keyId: apiKey.id,
        keyName: apiKey.name,
        scopes: apiKey.scopes,
      }
    };
  }

  @Get('balance')
  @RequireScopes('payments:read', 'account:read')
  @ApiOperation({
    summary: '💰 Consultar saldo da conta',
    description: `
### 💰 Saldo da Conta

Consulta o saldo disponível e pendente na sua conta.

**Scopes necessários:** \`payments:read\` + \`account:read\`

#### 💡 Entendendo os saldos:
- **Available**: Valor disponível para saque/uso imediato
- **Pending**: Valor em processamento (será liberado em até 1 dia útil)

#### 📊 Exemplo de uso:
\`\`\`javascript
const response = await fetch('/api/v1/payments/balance', {
  headers: {
    'Authorization': 'Bearer ntz_test_...',
    'Content-Type': 'application/json'
  }
});

const { data } = await response.json();
console.log('Disponível:', data.available / 100); // Converte centavos para reais
console.log('Pendente:', data.pending / 100);
\`\`\`

#### ⚡ Casos de uso:
- Verificar saldo antes de efetuar saques
- Exibir informações financeiras no dashboard
- Validar se há saldo suficiente para operações
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ Saldo recuperado com sucesso',
    type: BalanceResponseDto,
    schema: {
      example: {
        success: true,
        data: {
          available: 150000,
          pending: 25000,
          currency: 'BRL',
          lastUpdated: '2025-10-12T18:15:18.009Z'
        },
        message: 'Balance retrieved successfully',
        requestedBy: {
          keyId: 'cmgo0xcup0005nj5zlm4qpht5',
          keyName: 'Full Access Payment Key',
          scopes: ['payments:read', 'account:read']
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '🔐 API key inválida ou ausente'
  })
  @ApiResponse({
    status: 403,
    description: '🚫 Permissões insuficientes - scopes payments:read + account:read necessários'
  })
  async getBalance(@Request() req?: any) {
    const apiKey = req.apiKey;

    return {
      success: true,
      data: {
        available: 150000, // R$ 1,500.00
        pending: 25000,    // R$ 250.00
        currency: 'BRL',
        lastUpdated: new Date(),
      },
      message: 'Balance retrieved successfully',
      requestedBy: {
        keyId: apiKey.id,
        keyName: apiKey.name,
        scopes: apiKey.scopes,
      }
    };
  }

  @Get('webhooks')
  @RequireScopes('webhooks:read')
  @ApiOperation({ summary: 'Get webhooks configuration - requires webhooks:read scope' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getWebhooks(@Request() req?: any) {
    const apiKey = req.apiKey;

    return {
      success: true,
      data: [
        {
          id: 'wh_123',
          url: 'https://example.com/webhooks/payments',
          events: ['payment.completed', 'payment.failed'],
          active: true,
          createdAt: new Date(),
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
}