import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsEmail, IsOptional, Min, Max, Length, IsEnum } from 'class-validator';

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  BANK_SLIP = 'bank_slip',
  CRYPTO = 'crypto'
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Valor do pagamento em centavos (ex: 10000 = R$ 100,00)',
    example: 10000,
    minimum: 100,
    maximum: 10000000,
  })
  @IsNumber({}, { message: 'Amount deve ser um número' })
  @Min(100, { message: 'Valor mínimo é R$ 1,00 (100 centavos)' })
  @Max(10000000, { message: 'Valor máximo é R$ 100.000,00 (10000000 centavos)' })
  amount: number;

  @ApiProperty({
    description: 'Código da moeda (ISO 4217)',
    example: 'BRL',
    enum: ['BRL', 'USD', 'EUR'],
  })
  @IsString()
  @Length(3, 3, { message: 'Currency deve ter exatamente 3 caracteres' })
  currency: string;

  @ApiProperty({
    description: 'Descrição do pagamento',
    example: 'Compra de produto XYZ - Pedido #1234',
    maxLength: 500,
  })
  @IsString({ message: 'Description deve ser uma string' })
  @Length(1, 500, { message: 'Description deve ter entre 1 e 500 caracteres' })
  description: string;

  @ApiPropertyOptional({
    description: 'Email do cliente para notificações',
    example: 'cliente@exemplo.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'CustomerEmail deve ser um email válido' })
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Nome do cliente',
    example: 'João Silva',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  customerName?: string;

  @ApiPropertyOptional({
    description: 'CPF/CNPJ do cliente (apenas números)',
    example: '12345678901',
    minLength: 11,
    maxLength: 14,
  })
  @IsOptional()
  @IsString()
  @Length(11, 14)
  customerDocument?: string;

  @ApiPropertyOptional({
    description: 'Método de pagamento preferido',
    enum: PaymentMethod,
    example: PaymentMethod.PIX,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'URL de callback para notificação de status',
    example: 'https://minha-loja.com/webhooks/payments',
  })
  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @ApiPropertyOptional({
    description: 'ID externo do pedido no seu sistema',
    example: 'pedido-12345',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  externalId?: string;

  @ApiPropertyOptional({
    description: 'Dados adicionais em formato JSON',
    example: { "produto_id": "abc123", "categoria": "eletrônicos" },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}