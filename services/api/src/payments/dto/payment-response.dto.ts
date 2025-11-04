import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID único do pagamento',
    example: 'pay_1760292879706',
  })
  id: string;

  @ApiProperty({
    description: 'Valor em centavos',
    example: 10000,
  })
  amount: number;

  @ApiProperty({
    description: 'Código da moeda',
    example: 'BRL',
  })
  currency: string;

  @ApiProperty({
    description: 'Status atual do pagamento',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Compra de produto XYZ',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'Email do cliente',
    example: 'cliente@exemplo.com',
  })
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  customerName?: string;

  @ApiPropertyOptional({
    description: 'CPF/CNPJ do cliente',
    example: '12345678901',
  })
  customerDocument?: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento usado',
    example: 'pix',
  })
  method?: string;

  @ApiPropertyOptional({
    description: 'ID externo do seu sistema',
    example: 'pedido-12345',
  })
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais',
    example: { "produto_id": "abc123" },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação do pagamento',
    example: '2025-10-12T18:14:39.706Z',
  })
  createdAt: string;

  @ApiPropertyOptional({
    description: 'Data de atualização do pagamento',
    example: '2025-10-12T18:14:39.706Z',
  })
  updatedAt?: string;

  @ApiPropertyOptional({
    description: 'Data de processamento do pagamento',
    example: '2025-10-12T18:14:45.706Z',
  })
  processedAt?: string;

  @ApiPropertyOptional({
    description: 'Link de pagamento para o cliente',
    example: 'https://checkout.nutzbeta.com/pay/abc123',
  })
  paymentUrl?: string;

  @ApiPropertyOptional({
    description: 'Código QR para pagamento via PIX (base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Código PIX copia e cola',
    example: '00020126580014br.gov.bcb.pix013...',
  })
  pixCode?: string;
}

export class PaymentListResponseDto {
  @ApiProperty({
    description: 'Indica se a operação foi bem-sucedida',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Lista de pagamentos',
    type: [PaymentResponseDto],
  })
  data: PaymentResponseDto[];

  @ApiProperty({
    description: 'Mensagem de resposta',
    example: 'Payments retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Informações sobre a API key utilizada',
    example: {
      keyId: 'cmgo0xcup0005nj5zlm4qpht5',
      keyName: 'Minha Loja API Key',
      scopes: ['payments:read']
    },
  })
  requestedBy: {
    keyId: string;
    keyName: string;
    scopes: string[];
  };

  @ApiPropertyOptional({
    description: 'Informações de paginação',
    example: {
      page: 1,
      limit: 20,
      total: 156,
      totalPages: 8
    },
  })
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class BalanceResponseDto {
  @ApiProperty({
    description: 'Saldo disponível em centavos',
    example: 150000,
  })
  available: number;

  @ApiProperty({
    description: 'Saldo pendente em centavos',
    example: 25000,
  })
  pending: number;

  @ApiProperty({
    description: 'Código da moeda',
    example: 'BRL',
  })
  currency: string;

  @ApiProperty({
    description: 'Última atualização do saldo',
    example: '2025-10-12T18:15:18.009Z',
  })
  lastUpdated: string;
}