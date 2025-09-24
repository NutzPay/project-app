import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  Logger,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('XGate Webhooks')
@Controller('webhooks/xgate')
export class XGateWebhookController {
  private readonly logger = new Logger(XGateWebhookController.name);

  @ApiExcludeEndpoint() // Hide from Swagger docs (webhook endpoint)
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    this.logger.log('🔔 Received XGate webhook', {
      headers: this.sanitizeHeaders(headers),
      body: body,
      timestamp: new Date().toISOString(),
    });

    try {
      // Processar webhook da XGate
      await this.processXGateWebhook(body, headers);

      this.logger.log('✅ XGate webhook processed successfully');
      return { success: true, message: 'Webhook processed' };

    } catch (error) {
      this.logger.error('❌ Error processing XGate webhook', {
        error: error.message,
        stack: error.stack,
        body,
      });

      // Retorna 200 para evitar reenvios desnecessários
      return { success: false, error: error.message };
    }
  }

  private async processXGateWebhook(body: any, headers: any) {
    // Log detalhado da webhook
    this.logger.log('📝 Processing XGate webhook data:', {
      type: body.type || 'unknown',
      event: body.event || 'unknown',
      transaction: body.transaction || {},
      payment: body.payment || {},
      timestamp: body.timestamp || new Date().toISOString(),
    });

    // Aqui você pode adicionar a lógica específica da XGate
    // Por exemplo:
    // - Atualizar status de pagamento
    // - Notificar usuários
    // - Salvar no banco de dados
    // - Processar confirmações PIX

    // Exemplo de processamento básico
    if (body.event === 'payment.confirmed') {
      this.logger.log('💰 Payment confirmed via XGate', {
        amount: body.payment?.amount || 'unknown',
        currency: body.payment?.currency || 'unknown',
        method: body.payment?.method || 'unknown',
        transactionId: body.transaction?.id || 'unknown',
      });
    }

    if (body.event === 'payment.pending') {
      this.logger.log('⏳ Payment pending via XGate', {
        amount: body.payment?.amount || 'unknown',
        transactionId: body.transaction?.id || 'unknown',
      });
    }
  }

  private sanitizeHeaders(headers: any): any {
    // Remove headers sensíveis dos logs
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized['x-api-key'];
    delete sanitized.cookie;
    return sanitized;
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: any) {
    this.logger.log('🧪 Test webhook received', body);
    return { success: true, message: 'Test webhook received' };
  }
}