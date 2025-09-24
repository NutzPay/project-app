import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';

import { StarkBankService } from './starkbank.service';

@ApiTags('Stark Bank Webhooks')
@Controller('webhooks/starkbank')
export class StarkBankWebhookController {
  private readonly logger = new Logger(StarkBankWebhookController.name);

  constructor(private starkBankService: StarkBankService) {}

  @ApiExcludeEndpoint() // Hide from Swagger docs (webhook endpoint)
  @Post()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: any,
    @Headers('digital-signature') signature?: string,
  ) {
    this.logger.log('Received Stark Bank webhook', {
      signature: signature ? 'present' : 'missing',
      bodyType: typeof body,
    });

    // Get raw body for signature validation
    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(body);

    // Validate webhook signature
    if (signature) {
      const isValid = await this.starkBankService.validateWebhookSignature(
        rawBody,
        signature,
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }
    } else {
      this.logger.warn('Webhook received without signature - this should not happen in production');
    }

    try {
      // Process the webhook event
      await this.starkBankService.processWebhookEvent(body);

      this.logger.log('Webhook processed successfully');
      
      return {
        status: 'success',
        message: 'Webhook processed successfully',
      };
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Test webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Test webhook processed successfully' })
  @Post('test')
  async testWebhook(@Body() testData: any) {
    this.logger.log('Processing test webhook', testData);

    // Process as a test event
    await this.starkBankService.processWebhookEvent({
      ...testData,
      subscription: 'test',
      id: 'test-' + Date.now(),
    });

    return {
      status: 'success',
      message: 'Test webhook processed successfully',
      data: testData,
    };
  }
}