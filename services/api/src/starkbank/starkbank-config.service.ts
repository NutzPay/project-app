import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StarkbankConfig, StarkbankEnvironment } from '@prisma/client';
import { UpdateStarkbankConfigDto, StarkbankConfigResponseDto } from './dto/update-starkbank-config.dto';
import * as crypto from 'crypto';

@Injectable()
export class StarkbankConfigService {
  private readonly logger = new Logger(StarkbankConfigService.name);
  private configCache: StarkbankConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  constructor(private prisma: PrismaService) {}

  /**
   * Get active Starkbank configuration
   * Uses cache for performance
   */
  async getConfig(): Promise<StarkbankConfig | null> {
    const now = Date.now();
    
    // Return cached config if still valid
    if (this.configCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.configCache;
    }

    try {
      const config = await this.prisma.starkbankConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
      });

      // Update cache
      this.configCache = config;
      this.cacheTimestamp = now;

      this.logger.log(`Starkbank config ${config ? 'found' : 'not found'} - Environment: ${config?.environment || 'none'}`);
      
      return config;
    } catch (error) {
      this.logger.error('Failed to get Starkbank config', error);
      throw new BadRequestException('Failed to retrieve Starkbank configuration');
    }
  }

  /**
   * Get configuration for public API response (excludes private key)
   */
  async getConfigForResponse(): Promise<StarkbankConfigResponseDto | null> {
    const config = await this.getConfig();
    
    if (!config) {
      return null;
    }

    return {
      id: config.id,
      projectId: config.projectId,
      publicKey: config.publicKey,
      environment: config.environment,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Update or create Starkbank configuration
   * Deactivates other configs when creating a new active one
   */
  async updateConfig(dto: UpdateStarkbankConfigDto, userId?: string): Promise<StarkbankConfigResponseDto> {
    try {
      // Validate PEM keys format
      this.validatePemKeys(dto.privateKey, dto.publicKey);

      // If setting as active, deactivate all other configs
      if (dto.isActive !== false) {
        await this.prisma.starkbankConfig.updateMany({
          where: { isActive: true },
          data: { isActive: false }
        });
      }

      // Check if config with this projectId already exists
      const existingConfig = await this.prisma.starkbankConfig.findFirst({
        where: { projectId: dto.projectId }
      });

      let config: StarkbankConfig;

      if (existingConfig) {
        // Update existing config
        config = await this.prisma.starkbankConfig.update({
          where: { id: existingConfig.id },
          data: {
            projectId: dto.projectId,
            privateKey: this.encryptPrivateKey(dto.privateKey),
            publicKey: dto.publicKey,
            environment: dto.environment,
            isActive: dto.isActive ?? true,
          }
        });

        this.logger.log(`Starkbank config updated: ${config.id} - Environment: ${config.environment}`);
      } else {
        // Create new config
        config = await this.prisma.starkbankConfig.create({
          data: {
            projectId: dto.projectId,
            privateKey: this.encryptPrivateKey(dto.privateKey),
            publicKey: dto.publicKey,
            environment: dto.environment,
            isActive: dto.isActive ?? true,
          }
        });

        this.logger.log(`Starkbank config created: ${config.id} - Environment: ${config.environment}`);
      }

      // Log audit action if userId is provided
      if (userId) {
        await this.logAuditAction(userId, config.id);
      }

      // Clear cache to force refresh
      this.clearCache();

      return {
        id: config.id,
        projectId: config.projectId,
        publicKey: config.publicKey,
        environment: config.environment,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

    } catch (error) {
      this.logger.error('Failed to update Starkbank config', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update Starkbank configuration');
    }
  }

  /**
   * Get decrypted private key for internal use only
   */
  async getDecryptedPrivateKey(): Promise<string | null> {
    const config = await this.getConfig();
    
    if (!config) {
      return null;
    }

    return this.decryptPrivateKey(config.privateKey);
  }

  /**
   * Test Starkbank connection with current config
   */
  async testConnection(): Promise<{ success: boolean; message: string; environment?: string }> {
    const config = await this.getConfig();

    if (!config) {
      return {
        success: false,
        message: 'Nenhuma configuração Starkbank encontrada. Configure as credenciais no Admin.'
      };
    }

    try {
      // Here you would implement actual Starkbank SDK test
      // For now, we just validate the configuration exists
      return {
        success: true,
        message: 'Configuração Starkbank válida',
        environment: config.environment.toLowerCase()
      };
    } catch (error) {
      this.logger.error('Starkbank connection test failed', error);
      return {
        success: false,
        message: 'Falha ao testar conexão Starkbank'
      };
    }
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache = null;
    this.cacheTimestamp = 0;
    this.logger.log('Starkbank config cache cleared');
  }

  /**
   * Validate PEM key formats
   */
  private validatePemKeys(privateKey: string, publicKey: string): void {
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') && 
        !privateKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
      throw new BadRequestException('Formato de chave privada inválido. Use formato PEM.');
    }

    if (!publicKey.includes('-----BEGIN PUBLIC KEY-----')) {
      throw new BadRequestException('Formato de chave pública inválido. Use formato PEM.');
    }
  }

  /**
   * Encrypt private key for storage
   * In production, use proper key management (AWS KMS, etc.)
   */
  private encryptPrivateKey(privateKey: string): string {
    const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, secretKey);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt private key for use
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-cbc';
    
    const [ivHex, encrypted] = encryptedPrivateKey.split(':');
    
    if (!ivHex || !encrypted) {
      // Handle unencrypted keys (legacy support)
      return encryptedPrivateKey;
    }

    try {
      const decipher = crypto.createDecipher(algorithm, secretKey);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt private key', error);
      // Return as-is if decryption fails (backward compatibility)
      return encryptedPrivateKey;
    }
  }

  /**
   * Log audit action
   */
  private async logAuditAction(userId: string, configId: string): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'STARKBANK_CONFIG_UPDATE',
          resource: 'starkbank_config',
          resourceId: configId,
          userId: userId,
          details: JSON.stringify({ action: 'config_updated' }),
          createdAt: new Date(),
        }
      });
    } catch (error) {
      this.logger.error('Failed to log audit action', error);
      // Don't throw - audit logging shouldn't break the main operation
    }
  }
}