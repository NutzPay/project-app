import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiKeyStatus } from '@prisma/client';
import * as crypto from 'crypto';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-salt-for-hmac'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  describe('create', () => {
    it('should create API key with secure hash', async () => {
      const mockCreatedKey = {
        id: 'test-key-id',
        name: 'Test Key',
        keyHash: 'hashed-value',
        keySalt: 'random-salt',
        prefix: 'ntz_test_',
        scopes: ['payments:read'],
        ipWhitelist: [],
        status: ApiKeyStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: null,
      };

      mockPrismaService.apiKey.create.mockResolvedValue(mockCreatedKey);

      const result = await service.create(
        {
          name: 'Test Key',
          scopes: ['payments:read'],
          companyId: 'company-id',
        },
        'user-id'
      );

      expect(result.key).toMatch(/^ntz_test_[a-f0-9]{64}$/);
      expect(result.name).toBe('Test Key');
      expect(result.scopes).toEqual(['payments:read']);
      expect(mockPrismaService.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Key',
          scopes: ['payments:read'],
          status: ApiKeyStatus.ACTIVE,
        }),
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should generate unique salt for each key', async () => {
      const mockCreatedKey = {
        id: 'test-key-id',
        name: 'Test Key',
        keyHash: 'hashed-value',
        keySalt: 'random-salt',
        prefix: 'ntz_test_',
        scopes: ['payments:read'],
        ipWhitelist: [],
        status: ApiKeyStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: null,
      };

      mockPrismaService.apiKey.create.mockResolvedValue(mockCreatedKey);

      // Create multiple keys
      const result1 = await service.create({
        name: 'Key 1',
        scopes: ['payments:read'],
        companyId: 'company-id',
      }, 'user-id');

      const result2 = await service.create({
        name: 'Key 2',
        scopes: ['payments:read'],
        companyId: 'company-id',
      }, 'user-id');

      expect(result1.key).not.toBe(result2.key);
    });
  });

  describe('validateScopes', () => {
    it('should validate wildcard scopes correctly', () => {
      const keyScopes = ['payments:*', 'webhooks:read'];
      
      expect(service.validateScopes(['payments:read'], keyScopes)).toBe(true);
      expect(service.validateScopes(['payments:write'], keyScopes)).toBe(true);
      expect(service.validateScopes(['webhooks:read'], keyScopes)).toBe(true);
      expect(service.validateScopes(['webhooks:write'], keyScopes)).toBe(false);
      expect(service.validateScopes(['admin:read'], keyScopes)).toBe(false);
    });

    it('should validate exact scopes correctly', () => {
      const keyScopes = ['payments:read', 'webhooks:read'];
      
      expect(service.validateScopes(['payments:read'], keyScopes)).toBe(true);
      expect(service.validateScopes(['payments:write'], keyScopes)).toBe(false);
      expect(service.validateScopes(['webhooks:read'], keyScopes)).toBe(true);
    });

    it('should validate super wildcard correctly', () => {
      const keyScopes = ['*'];
      
      expect(service.validateScopes(['payments:read'], keyScopes)).toBe(true);
      expect(service.validateScopes(['admin:delete'], keyScopes)).toBe(true);
      expect(service.validateScopes(['any:scope'], keyScopes)).toBe(true);
    });
  });

  describe('revoke', () => {
    it('should revoke active API key', async () => {
      const mockKey = {
        id: 'test-key-id',
        name: 'Test Key',
        status: ApiKeyStatus.ACTIVE,
        user: { id: 'user-id', name: 'Test User', email: 'test@example.com' },
        company: { id: 'company-id', name: 'Test Company' },
      };

      const mockUpdatedKey = {
        ...mockKey,
        status: ApiKeyStatus.REVOKED,
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrismaService.apiKey.update.mockResolvedValue(mockUpdatedKey);

      const result = await service.revoke('test-key-id', 'user-id', 'company-id');

      expect(result.message).toBe('API key revoked successfully');
      expect(mockPrismaService.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'test-key-id' },
        data: {
          status: ApiKeyStatus.REVOKED,
          updatedAt: expect.any(Date),
        },
      });
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw error when trying to revoke already revoked key', async () => {
      const mockKey = {
        id: 'test-key-id',
        name: 'Test Key',
        status: ApiKeyStatus.REVOKED,
        user: { id: 'user-id', name: 'Test User', email: 'test@example.com' },
        company: { id: 'company-id', name: 'Test Company' },
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);

      await expect(
        service.revoke('test-key-id', 'user-id', 'company-id')
      ).rejects.toThrow('API key is already revoked');
    });
  });
});