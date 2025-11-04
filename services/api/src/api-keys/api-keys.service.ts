import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiKeyStatus, AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

export interface CreateApiKeyResult {
  id: string;
  name: string;
  key: string; // Only shown once
  prefix: string;
  scopes: string[];
  expiresAt?: Date;
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  async create(
    data: {
      name: string;
      scopes: string[];
      ipWhitelist?: string[];
      expiresAt?: Date;
      companyId: string;
    },
    userId?: string,
    auditInfo: { ip?: string; userAgent?: string } = {},
  ): Promise<CreateApiKeyResult> {
    // Generate secure API key
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const apiKey = `ntz_${environment}_${randomBytes}`;
    
    // Generate unique salt for this key
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Create HMAC hash
    const keyHash = crypto
      .createHmac('sha256', this.configService.get('API_KEY_SALT'))
      .update(apiKey + salt)
      .digest('hex');

    // First, try to create or ensure user exists (simple approach for demo)
    try {
      await this.prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `api-user-${userId}@example.com`,
          name: 'API User',
          password: '$2a$12$dummy.password.hash.for.api.user.not.used.in.real.auth', // Dummy hash for API users
          role: 'MEMBER', // Use valid enum value
          status: 'ACTIVE', // Add required status
        },
      });

      await this.prisma.company.upsert({
        where: { id: data.companyId },
        update: {},
        create: {
          id: data.companyId,
          name: data.name + ' Company',
          email: `company-${data.companyId}@example.com`,
          document: `${Date.now().toString().substr(-11)}`, // Fake 11-digit document
          status: 'ACTIVE',
        },
      });
    } catch (error) {
      console.log('User/Company creation error (may already exist):', error.message);
    }

    const createdKey = await this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash,
        keySalt: salt,
        prefix: `ntz_${environment}_`,
        scopes: data.scopes,
        ipWhitelist: data.ipWhitelist || [],
        expiresAt: data.expiresAt,
        userId,
        companyId: data.companyId,
        status: ApiKeyStatus.ACTIVE,
      },
    });

    // Audit log
    if (userId) {
      await this.auditService.log({
        action: AuditAction.API_KEY_GENERATE,
        userId,
        companyId: data.companyId,
        resource: 'api_key',
        resourceId: createdKey.id,
        details: {
          keyName: data.name,
          scopes: data.scopes,
          expiresAt: data.expiresAt,
        },
        ipAddress: auditInfo.ip,
        userAgent: auditInfo.userAgent,
      });
    }

    return {
      id: createdKey.id,
      name: createdKey.name,
      key: apiKey, // Only returned here, never stored
      prefix: createdKey.prefix,
      scopes: createdKey.scopes,
      expiresAt: createdKey.expiresAt,
      createdAt: createdKey.createdAt,
    };
  }

  async findAll(companyId?: string, userId?: string) {
    return this.prisma.apiKey.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(userId && { userId }),
        status: { not: ApiKeyStatus.REVOKED },
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        ipWhitelist: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        lastUsedIp: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        ipWhitelist: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        lastUsedIp: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  async revoke(
    id: string,
    userId: string,
    companyId: string,
    auditInfo: { ip?: string; userAgent?: string } = {},
  ) {
    const apiKey = await this.findById(id);
    
    if (apiKey.status === ApiKeyStatus.REVOKED) {
      throw new BadRequestException('API key is already revoked');
    }

    const updatedKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        status: ApiKeyStatus.REVOKED,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      action: AuditAction.API_KEY_REVOKE,
      userId,
      companyId,
      resource: 'api_key',
      resourceId: id,
      details: {
        keyName: apiKey.name,
        revokedAt: new Date(),
      },
      ipAddress: auditInfo.ip,
      userAgent: auditInfo.userAgent,
    });

    return { message: 'API key revoked successfully' };
  }

  async rotate(
    id: string,
    userId: string,
    companyId: string,
    auditInfo: { ip?: string; userAgent?: string } = {},
  ): Promise<CreateApiKeyResult> {
    const existingKey = await this.findById(id);
    
    if (existingKey.status !== ApiKeyStatus.ACTIVE) {
      throw new BadRequestException('Can only rotate active API keys');
    }

    // Revoke the old key
    await this.revoke(id, userId, companyId, auditInfo);

    // Create new key with same properties
    const newKey = await this.create(
      {
        name: existingKey.name + ' (Rotated)',
        scopes: existingKey.scopes,
        ipWhitelist: existingKey.ipWhitelist,
        expiresAt: existingKey.expiresAt,
        companyId,
      },
      userId,
      auditInfo,
    );

    // Audit log for rotation
    await this.auditService.log({
      action: AuditAction.API_KEY_ROTATE,
      userId,
      companyId,
      resource: 'api_key',
      resourceId: id,
      details: {
        oldKeyId: id,
        newKeyId: newKey.id,
        rotatedAt: new Date(),
      },
      ipAddress: auditInfo.ip,
      userAgent: auditInfo.userAgent,
    });

    return newKey;
  }

  async updateScopes(
    id: string,
    scopes: string[],
    userId: string,
    companyId: string,
    auditInfo: { ip?: string; userAgent?: string } = {},
  ) {
    const apiKey = await this.findById(id);
    
    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      throw new BadRequestException('Can only update active API keys');
    }

    const updatedKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        scopes,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      action: AuditAction.UPDATE,
      userId,
      companyId,
      resource: 'api_key',
      resourceId: id,
      details: {
        keyName: apiKey.name,
        oldScopes: apiKey.scopes,
        newScopes: scopes,
      },
      ipAddress: auditInfo.ip,
      userAgent: auditInfo.userAgent,
    });

    return updatedKey;
  }

  async updateIpWhitelist(
    id: string,
    ipWhitelist: string[],
    userId: string,
    companyId: string,
    auditInfo: { ip?: string; userAgent?: string } = {},
  ) {
    const apiKey = await this.findById(id);
    
    if (apiKey.status !== ApiKeyStatus.ACTIVE) {
      throw new BadRequestException('Can only update active API keys');
    }

    const updatedKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        ipWhitelist,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      action: AuditAction.UPDATE,
      userId,
      companyId,
      resource: 'api_key',
      resourceId: id,
      details: {
        keyName: apiKey.name,
        oldIpWhitelist: apiKey.ipWhitelist,
        newIpWhitelist: ipWhitelist,
      },
      ipAddress: auditInfo.ip,
      userAgent: auditInfo.userAgent,
    });

    return updatedKey;
  }

  // Method to validate API key and return the matched key with scopes
  async validateApiKey(apiKey: string) {
    // Get all API keys from database (with sensitive fields)
    const allKeys = await this.prisma.apiKey.findMany({
      where: {
        status: 'ACTIVE', // Only check active keys
      },
      select: {
        id: true,
        name: true,
        keyHash: true,
        keySalt: true,
        scopes: true,
        ipWhitelist: true,
        status: true,
        expiresAt: true,
        lastUsedAt: true,
        lastUsedIp: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Search for matching key by comparing hashes
    for (const key of allKeys) {
      const testHash = crypto
        .createHmac('sha256', this.configService.get('API_KEY_SALT'))
        .update(apiKey + key.keySalt)
        .digest('hex');

      if (testHash === key.keyHash) {
        return key;
      }
    }

    return null;
  }

  // Method to validate scopes
  validateScopes(requiredScopes: string[], keyScopes: string[]): boolean {
    for (const requiredScope of requiredScopes) {
      const hasScope = keyScopes.some(scope => {
        if (scope === '*' || scope === requiredScope) return true;
        if (scope.endsWith(':*')) {
          const prefix = scope.slice(0, -1);
          return requiredScope.startsWith(prefix);
        }
        return false;
      });

      if (!hasScope) return false;
    }

    return true;
  }
}