import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WebhookStatus, AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

export interface WebhookEvent {
  type: string;
  data: any;
  timestamp: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @InjectQueue('webhook-delivery') private webhookQueue: Queue,
  ) {}

  async create(
    companyId: string,
    data: {
      url: string;
      events: string[];
      maxRetries?: number;
    },
    auditInfo: { userId?: string; ip?: string; userAgent?: string } = {},
  ) {
    // Generate secret for HMAC signing
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await this.prisma.webhook.create({
      data: {
        url: data.url,
        secret,
        events: data.events,
        maxRetries: data.maxRetries || 3,
        companyId,
        status: WebhookStatus.ACTIVE,
      },
    });

    // Audit log
    if (auditInfo.userId) {
      await this.auditService.log({
        action: AuditAction.CREATE,
        userId: auditInfo.userId,
        companyId,
        resource: 'webhook',
        resourceId: webhook.id,
        details: {
          url: data.url,
          events: data.events,
        },
        ipAddress: auditInfo.ip,
        userAgent: auditInfo.userAgent,
      });
    }

    return {
      ...webhook,
      // Return secret only once, on creation
      secret: webhook.secret,
    };
  }

  async findAll(companyId?: string) {
    return this.prisma.webhook.findMany({
      where: companyId ? { companyId } : undefined,
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        maxRetries: true,
        retryCount: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret in list
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        maxRetries: true,
        retryCount: true,
        lastTriggeredAt: true,
        createdAt: true,
        updatedAt: true,
        // Don't return secret
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 deliveries
          select: {
            id: true,
            eventType: true,
            responseStatus: true,
            deliveredAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async update(
    id: string,
    data: {
      url?: string;
      events?: string[];
      status?: WebhookStatus;
      maxRetries?: number;
    },
    auditInfo: { userId?: string; companyId?: string; ip?: string; userAgent?: string } = {},
  ) {
    const existingWebhook = await this.findById(id);

    try {
      const updatedWebhook = await this.prisma.webhook.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });

      // Audit log
      if (auditInfo.userId) {
        await this.auditService.log({
          action: AuditAction.UPDATE,
          userId: auditInfo.userId,
          companyId: auditInfo.companyId,
          resource: 'webhook',
          resourceId: id,
          details: {
            changes: data,
            previousUrl: existingWebhook.url,
          },
          ipAddress: auditInfo.ip,
          userAgent: auditInfo.userAgent,
        });
      }

      return updatedWebhook;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Webhook not found');
      }
      throw error;
    }
  }

  async delete(
    id: string,
    auditInfo: { userId?: string; companyId?: string; ip?: string; userAgent?: string } = {},
  ) {
    const webhook = await this.findById(id);

    try {
      await this.prisma.webhook.delete({
        where: { id },
      });

      // Audit log
      if (auditInfo.userId) {
        await this.auditService.log({
          action: AuditAction.DELETE,
          userId: auditInfo.userId,
          companyId: auditInfo.companyId,
          resource: 'webhook',
          resourceId: id,
          details: {
            url: webhook.url,
            events: webhook.events,
            deletedAt: new Date(),
          },
          ipAddress: auditInfo.ip,
          userAgent: auditInfo.userAgent,
        });
      }
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Webhook not found');
      }
      throw error;
    }
  }

  async rotateSecret(
    id: string,
    auditInfo: { userId?: string; companyId?: string; ip?: string; userAgent?: string } = {},
  ) {
    const webhook = await this.findById(id);
    
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');

    const updatedWebhook = await this.prisma.webhook.update({
      where: { id },
      data: {
        secret: newSecret,
        updatedAt: new Date(),
      },
    });

    // Audit log
    if (auditInfo.userId) {
      await this.auditService.log({
        action: AuditAction.UPDATE,
        userId: auditInfo.userId,
        companyId: auditInfo.companyId,
        resource: 'webhook',
        resourceId: id,
        details: {
          action: 'secret_rotated',
          url: webhook.url,
        },
        ipAddress: auditInfo.ip,
        userAgent: auditInfo.userAgent,
      });
    }

    return {
      id: updatedWebhook.id,
      message: 'Secret rotated successfully',
      // Return new secret only once
      secret: newSecret,
    };
  }

  async triggerWebhook(companyId: string, event: WebhookEvent) {
    // Find all active webhooks for this company that listen to this event
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        companyId,
        status: WebhookStatus.ACTIVE,
        events: {
          has: event.type, // Array contains event type
        },
      },
    });

    // Queue webhook deliveries
    for (const webhook of webhooks) {
      await this.queueWebhookDelivery(webhook.id, event);
    }

    return { message: `Queued ${webhooks.length} webhook deliveries` };
  }

  async queueWebhookDelivery(webhookId: string, event: WebhookEvent) {
    const payload = {
      id: crypto.randomUUID(),
      event_type: event.type,
      data: event.data,
      timestamp: event.timestamp,
    };

    await this.webhookQueue.add('deliver-webhook', {
      webhookId,
      payload,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 seconds
      },
    });
  }

  async createSignature(payload: string, secret: string): Promise<string> {
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  async verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const expectedSignature = await this.createSignature(payload, secret);
    const providedSignature = signature.replace('sha256=', '');
    
    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }

  async testWebhook(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    const testEvent: WebhookEvent = {
      type: 'webhook.test',
      data: {
        message: 'This is a test webhook from NutzBeta',
        webhook_id: id,
      },
      timestamp: new Date().toISOString(),
    };

    await this.queueWebhookDelivery(id, testEvent);

    return { message: 'Test webhook queued successfully' };
  }
}