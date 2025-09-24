import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { StarkbankConfigService } from './starkbank-config.service';
import { UpdateStarkbankConfigDto, StarkbankConfigResponseDto } from './dto/update-starkbank-config.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/starkbank')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class StarkbankConfigController {
  private readonly logger = new Logger(StarkbankConfigController.name);

  constructor(private readonly starkbankConfigService: StarkbankConfigService) {}

  @Get('config')
  async getConfig(): Promise<StarkbankConfigResponseDto | null> {
    this.logger.log('Getting Starkbank configuration');
    
    try {
      const config = await this.starkbankConfigService.getConfigForResponse();
      
      if (!config) {
        this.logger.warn('No Starkbank configuration found');
        return null;
      }

      this.logger.log(`Starkbank config retrieved: ${config.environment}`);
      return config;
    } catch (error) {
      this.logger.error('Failed to get Starkbank config', error);
      throw error;
    }
  }

  @Get('config/private-key')
  async getPrivateKey(): Promise<{ privateKey: string | null }> {
    this.logger.log('Getting Starkbank private key');
    
    try {
      const privateKey = await this.starkbankConfigService.getDecryptedPrivateKey();
      
      if (!privateKey) {
        this.logger.warn('No private key found');
        return { privateKey: null };
      }

      // Log without exposing the actual key
      this.logger.log('Private key retrieved successfully');
      return { privateKey };
    } catch (error) {
      this.logger.error('Failed to get private key', error);
      throw error;
    }
  }

  @Post('config')
  @HttpCode(HttpStatus.OK)
  async updateConfig(
    @Body() updateConfigDto: UpdateStarkbankConfigDto,
    @Request() req: any,
  ): Promise<StarkbankConfigResponseDto> {
    this.logger.log(`Updating Starkbank configuration - Environment: ${updateConfigDto.environment}`);
    
    try {
      // Extract user ID from request (assuming it's added by auth middleware)
      const userId = req.user?.id;
      
      const config = await this.starkbankConfigService.updateConfig(updateConfigDto, userId);
      
      this.logger.log(`Starkbank config updated successfully: ${config.id}`);
      return config;
    } catch (error) {
      this.logger.error('Failed to update Starkbank config', error);
      throw error;
    }
  }

  @Get('test-connection')
  async testConnection(): Promise<{ success: boolean; message: string; environment?: string }> {
    this.logger.log('Testing Starkbank connection');
    
    try {
      const result = await this.starkbankConfigService.testConnection();
      
      if (result.success) {
        this.logger.log(`Starkbank connection test successful - Environment: ${result.environment}`);
      } else {
        this.logger.warn(`Starkbank connection test failed: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error('Starkbank connection test error', error);
      return {
        success: false,
        message: 'Erro interno ao testar conexão'
      };
    }
  }

  @Post('clear-cache')
  @HttpCode(HttpStatus.OK)
  async clearCache(): Promise<{ success: boolean; message: string }> {
    this.logger.log('Clearing Starkbank configuration cache');
    
    try {
      this.starkbankConfigService.clearCache();
      
      return {
        success: true,
        message: 'Cache limpo com sucesso'
      };
    } catch (error) {
      this.logger.error('Failed to clear cache', error);
      return {
        success: false,
        message: 'Erro ao limpar cache'
      };
    }
  }
}