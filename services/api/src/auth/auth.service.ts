import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

import { PrismaService } from '../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await argon2.verify(user.password, password)) {
      return user;
    }
    
    return null;
  }

  async login(user: User, totpCode?: string, request?: any) {
    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        throw new UnauthorizedException('2FA code is required');
      }

      const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2, // Allow 2 time steps of variance
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id, request?.ip);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    // Create session
    const sessionToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    
    await this.prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async logout(sessionToken: string) {
    await this.prisma.session.deleteMany({
      where: { sessionToken },
    });
  }

  async setup2FA(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = speakeasy.generateSecret({
      name: `NutzBeta (${user.email})`,
      issuer: 'NutzBeta',
    });

    // Save secret temporarily (not enabled yet)
    await this.usersService.update(userId, {
      twoFactorSecret: secret.base32,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async enable2FA(userId: string, totpCode: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.usersService.update(userId, {
      twoFactorEnabled: true,
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string, totpCode: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: totpCode,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    await this.usersService.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });

    return { message: '2FA disabled successfully' };
  }

  async validateApiKey(apiKey: string): Promise<any> {
    if (!apiKey.startsWith('ntz_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Extract the actual key value (remove prefix)
    const keyValue = apiKey;
    
    // Find all API keys and check hash
    const apiKeys = await this.prisma.apiKey.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        user: true,
        company: true,
      },
    });

    for (const key of apiKeys) {
      const hash = require('crypto')
        .createHmac('sha256', this.configService.get('API_KEY_SALT'))
        .update(keyValue + key.keySalt)
        .digest('hex');

      if (hash === key.keyHash) {
        // Update last used
        await this.prisma.apiKey.update({
          where: { id: key.id },
          data: {
            lastUsedAt: new Date(),
          },
        });

        return {
          apiKey: key,
          user: key.user,
          company: key.company,
        };
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}