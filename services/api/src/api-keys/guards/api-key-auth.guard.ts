import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private apiKeysService: ApiKeysService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get API key from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('API key required');
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate API key format
    if (!apiKey.startsWith('ntz_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Find API key by validating against the service method
    let matchedKey = null;

    try {
      // We need a new method in the service to validate API keys
      matchedKey = await this.apiKeysService.validateApiKey(apiKey);
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!matchedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is active
    if (matchedKey.status !== 'ACTIVE') {
      throw new UnauthorizedException('API key is not active');
    }

    // Check if key is expired
    if (matchedKey.expiresAt && new Date() > matchedKey.expiresAt) {
      throw new UnauthorizedException('API key has expired');
    }

    // Check IP whitelist if configured
    if (matchedKey.ipWhitelist && matchedKey.ipWhitelist.length > 0) {
      const clientIp = this.getClientIp(request);
      if (!matchedKey.ipWhitelist.includes(clientIp)) {
        throw new ForbiddenException('IP address not allowed');
      }
    }

    // Get required scopes from decorator
    const requiredScopes = this.reflector.get<string[]>('scopes', context.getHandler()) || [];

    // Check if API key has required scopes
    if (requiredScopes.length > 0) {
      const hasPermission = this.apiKeysService.validateScopes(requiredScopes, matchedKey.scopes);
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // Add API key info to request for use in controllers
    request['apiKey'] = matchedKey;

    // Update last used timestamp (fire and forget)
    this.updateLastUsed(matchedKey.id, this.getClientIp(request)).catch(() => {
      // Silent fail for last used update
    });

    return true;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private async updateLastUsed(keyId: string, ip: string): Promise<void> {
    // This would update the lastUsedAt and lastUsedIp fields
    // Implementation would depend on your service structure
  }
}