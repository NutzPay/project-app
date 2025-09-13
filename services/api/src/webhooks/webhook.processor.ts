import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { WebhooksService } from './webhooks.service';
import axios from 'axios';

interface WebhookJob {
  webhookId: string;
  payload: any;
}

@Processor('webhook-delivery')
@Injectable()
export class WebhookProcessor {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private prisma: PrismaService,
    private webhooksService: WebhooksService,
  ) {}

  @Process('deliver-webhook')
  async handleWebhookDelivery(job: Job<WebhookJob>) {
    const { webhookId, payload } = job.data;
    
    this.logger.log(`Processing webhook delivery for webhook ${webhookId}`);

    const webhook = await this.prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      this.logger.error(`Webhook ${webhookId} not found`);
      throw new Error('Webhook not found');
    }

    if (webhook.status !== 'ACTIVE') {
      this.logger.warn(`Webhook ${webhookId} is not active, skipping delivery`);
      return;
    }

    const payloadString = JSON.stringify(payload);
    const signature = await this.webhooksService.createSignature(payloadString, webhook.secret);

    // Create delivery record
    const delivery = await this.prisma.webhookDelivery.create({
      data: {
        webhookId,
        eventType: payload.event_type,
        payload: payloadString,
        signature: `sha256=${signature}`,
      },
    });

    try {
      // Make HTTP request
      const response = await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NutzBeta-Webhooks/1.0',
          'X-Nutz-Delivery': delivery.id,
          'X-Nutz-Event': payload.event_type,
          'X-Nutz-Signature': `sha256=${signature}`,
        },
        timeout: 30000, // 30 seconds
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Update delivery with success
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          responseStatus: response.status,
          responseBody: JSON.stringify({
            headers: response.headers,
            data: typeof response.data === 'string' 
              ? response.data.substring(0, 1000) // Truncate large responses
              : response.data,
          }),
          deliveredAt: new Date(),
        },
      });

      // Update webhook last triggered time and reset retry count
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: {
          lastTriggeredAt: new Date(),
          retryCount: 0,
        },
      });

      this.logger.log(`Webhook ${webhookId} delivered successfully (${response.status})`);

    } catch (error) {
      const responseStatus = error.response?.status || 0;
      const responseBody = error.response?.data || error.message;

      // Update delivery with error
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          responseStatus,
          responseBody: JSON.stringify({
            error: error.message,
            response: typeof responseBody === 'string' 
              ? responseBody.substring(0, 1000)
              : responseBody,
          }),
        },
      });

      // Increment retry count
      await this.prisma.webhook.update({
        where: { id: webhookId },
        data: {
          retryCount: {
            increment: 1,
          },
        },
      });

      // Check if we should disable the webhook after too many failures
      const updatedWebhook = await this.prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (updatedWebhook && updatedWebhook.retryCount >= updatedWebhook.maxRetries) {
        await this.prisma.webhook.update({
          where: { id: webhookId },
          data: {
            status: 'FAILED',
          },
        });

        this.logger.warn(
          `Webhook ${webhookId} disabled after ${updatedWebhook.maxRetries} failed attempts`
        );
      }

      this.logger.error(
        `Webhook ${webhookId} delivery failed: ${error.message} (${responseStatus})`
      );

      // Re-throw to trigger Bull's retry mechanism
      throw error;
    }
  }
}