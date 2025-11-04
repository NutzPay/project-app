import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Delete,
  Patch,
  Request,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createApiKeyDto: CreateApiKeyDto, @Request() req?: any) {
    // For now, use a default user ID - later this will come from JWT auth
    const userId = 'default-user';
    const auditInfo = {
      ip: req?.ip || '127.0.0.1',
      userAgent: req?.headers['user-agent'] || 'API Client',
    };

    // Convert expiresAt from string to Date if provided
    const payload = {
      ...createApiKeyDto,
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : undefined,
      companyId: createApiKeyDto.companyId || `company-${Date.now()}`, // Use provided or generate unique
    };

    // Generate a unique user ID for this demo (in production this would come from JWT)
    const demoUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await this.apiKeysService.create(payload, demoUserId, auditInfo);

    return {
      success: true,
      data: result,
      message: 'API key created successfully'
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for user/company' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll() {
    // For now, return all keys - later filter by user/company
    const keys = await this.apiKeysService.findAll();

    return {
      success: true,
      data: keys,
      message: 'API keys retrieved successfully'
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    const key = await this.apiKeysService.findById(id);

    return {
      success: true,
      data: key,
      message: 'API key retrieved successfully'
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 400, description: 'API key already revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @HttpCode(HttpStatus.OK)
  async revoke(@Param('id') id: string, @Request() req?: any) {
    // Get the API key first to find the associated user and company
    const apiKey = await this.apiKeysService.findById(id);

    const auditInfo = {
      ip: req?.ip || '127.0.0.1',
      userAgent: req?.headers['user-agent'] || 'API Client',
    };

    await this.apiKeysService.revoke(
      id,
      apiKey.user.id,
      apiKey.company?.id || apiKey.user.id, // Use company ID if available, fallback to user ID
      auditInfo
    );

    return {
      success: true,
      message: 'API key revoked successfully'
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update API key (rotate or update scopes/IPs)' })
  @ApiResponse({ status: 200, description: 'API key updated successfully' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiResponse({ status: 400, description: 'Invalid operation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateData: { action: string; scopes?: string[]; ipWhitelist?: string[] },
    @Request() req?: any
  ) {
    // Get the API key first to find the associated user and company
    const apiKey = await this.apiKeysService.findById(id);

    const auditInfo = {
      ip: req?.ip || '127.0.0.1',
      userAgent: req?.headers['user-agent'] || 'API Client',
    };

    const userId = apiKey.user.id;
    const companyId = apiKey.company?.id || apiKey.user.id;

    let result;

    switch (updateData.action) {
      case 'rotate':
        result = await this.apiKeysService.rotate(id, userId, companyId, auditInfo);
        return {
          success: true,
          data: result,
          message: 'API key rotated successfully'
        };

      case 'update_scopes':
        if (!updateData.scopes) {
          throw new Error('Scopes are required for scope update');
        }
        result = await this.apiKeysService.updateScopes(
          id,
          updateData.scopes,
          userId,
          companyId,
          auditInfo
        );
        return {
          success: true,
          data: result,
          message: 'API key scopes updated successfully'
        };

      case 'update_ips':
        if (!updateData.ipWhitelist) {
          throw new Error('IP whitelist is required for IP update');
        }
        result = await this.apiKeysService.updateIpWhitelist(
          id,
          updateData.ipWhitelist,
          userId,
          companyId,
          auditInfo
        );
        return {
          success: true,
          data: result,
          message: 'API key IP whitelist updated successfully'
        };

      default:
        throw new Error(`Unknown action: ${updateData.action}`);
    }
  }
}

