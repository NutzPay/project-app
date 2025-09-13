import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WebhookStatus } from '@prisma/client';
import * as crypto from 'crypto';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    webhook: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: getQueueToken('webhook-delivery'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('create', () => {
    it('should create webhook with generated secret', async () => {
      const mockCreatedWebhook = {
        id: 'webhook-id',
        url: 'https://example.com/webhook',
        secret: 'generated-secret',
        events: ['payment.created'],
        status: WebhookStatus.ACTIVE,
        maxRetries: 3,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.webhook.create.mockResolvedValue(mockCreatedWebhook);

      const result = await service.create(
        'company-id',
        {
          url: 'https://example.com/webhook',
          events: ['payment.created'],
        }
      );

      expect(result.url).toBe('https://example.com/webhook');
      expect(result.events).toEqual(['payment.created']);
      expect(result.secret).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex
      expect(mockPrismaService.webhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          url: 'https://example.com/webhook',
          events: ['payment.created'],
          status: WebhookStatus.ACTIVE,
          maxRetries: 3,
        }),
      });
    });

    it('should use custom maxRetries if provided', async () => {
      const mockCreatedWebhook = {
        id: 'webhook-id',
        url: 'https://example.com/webhook',
        secret: 'generated-secret',
        events: ['payment.created'],
        status: WebhookStatus.ACTIVE,
        maxRetries: 5,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.webhook.create.mockResolvedValue(mockCreatedWebhook);

      await service.create(
        'company-id',
        {
          url: 'https://example.com/webhook',
          events: ['payment.created'],
          maxRetries: 5,
        }
      );

      expect(mockPrismaService.webhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          maxRetries: 5,
        }),
      });
    });
  });

  describe('createSignature', () => {
    it('should create correct HMAC signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      
      const signature = await service.createSignature(payload, secret);
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      expect(signature).toBe(expectedSignature);
    });
  });

  describe('verifySignature', () => {
    it('should verify signature correctly', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      
      const signature = await service.createSignature(payload, secret);
      
      const isValid = await service.verifySignature(
        payload,
        `sha256=${signature}`,
        secret
      );
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      
      const isValid = await service.verifySignature(
        payload,
        'sha256=invalid-signature',
        secret
      );
      
      expect(isValid).toBe(false);
    });

    it('should reject signature without sha256 prefix', async () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      
      const signature = await service.createSignature(payload, secret);
      
      const isValid = await service.verifySignature(
        payload,
        signature, // Without sha256= prefix
        secret
      );
      
      expect(isValid).toBe(false);
    });
  });

  describe('triggerWebhook', () => {
    it('should queue webhooks for matching events', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          events: ['payment.created', 'payment.completed'],
          status: WebhookStatus.ACTIVE,
        },
        {
          id: 'webhook-2',
          events: ['payment.created'],
          status: WebhookStatus.ACTIVE,
        },
      ];

      mockPrismaService.webhook.findMany.mockResolvedValue(mockWebhooks);

      const event = {
        type: 'payment.created',
        data: { id: 'payment-123' },
        timestamp: new Date().toISOString(),
      };

      const result = await service.triggerWebhook('company-id', event);

      expect(result.message).toBe('Queued 2 webhook deliveries');
      expect(mockPrismaService.webhook.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-id',
          status: WebhookStatus.ACTIVE,
          events: {
            has: 'payment.created',
          },
        },
      });
      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should not queue inactive webhooks', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          events: ['payment.created'],
          status: WebhookStatus.INACTIVE,
        },
      ];

      mockPrismaService.webhook.findMany.mockResolvedValue(mockWebhooks);

      const event = {
        type: 'payment.created',
        data: { id: 'payment-123' },
        timestamp: new Date().toISOString(),
      };

      const result = await service.triggerWebhook('company-id', event);

      expect(result.message).toBe('Queued 0 webhook deliveries');
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('rotateSecret', () => {
    it('should generate new secret and update webhook', async () => {
      const mockWebhook = {
        id: 'webhook-id',
        url: 'https://example.com/webhook',
        events: ['payment.created'],
        status: WebhookStatus.ACTIVE,
      };

      const mockUpdatedWebhook = {
        ...mockWebhook,
        secret: 'new-secret',
        updatedAt: new Date(),
      };

      mockPrismaService.webhook.findUnique.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockResolvedValue(mockUpdatedWebhook);

      const result = await service.rotateSecret('webhook-id');

      expect(result.message).toBe('Secret rotated successfully');
      expect(result.secret).toMatch(/^[a-f0-9]{64}$/);
      expect(mockPrismaService.webhook.update).toHaveBeenCalledWith({
        where: { id: 'webhook-id' },
        data: {
          secret: expect.any(String),
          updatedAt: expect.any(Date),
        },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });
  });
});