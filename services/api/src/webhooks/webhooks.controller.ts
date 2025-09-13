import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Webhooks')
@ApiBearerAuth('apikey')
@UseGuards(AuthGuard('jwt'))
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @ApiOperation({ summary: 'Create new webhook' })
  @ApiResponse({ 
    status: 201, 
    description: 'Webhook created successfully. Secret is only shown once!' 
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.MEMBER)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createWebhookDto: CreateWebhookDto, @Request() req) {
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.webhooksService.create(
      req.user.companyId,
      createWebhookDto,
      auditInfo,
    );
  }

  @ApiOperation({ summary: 'List all webhooks' })
  @ApiResponse({ status: 200, description: 'Webhooks retrieved successfully' })
  @Get()
  findAll(@Request() req) {
    // Super admins can see all webhooks, others only their company
    const companyId = req.user.role === UserRole.SUPER_ADMIN 
      ? undefined 
      : req.user.companyId;

    return this.webhooksService.findAll(companyId);
  }

  @ApiOperation({ summary: 'Get webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook retrieved successfully' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhooksService.findById(id);
  }

  @ApiOperation({ summary: 'Update webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.MEMBER)
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
    @Request() req,
  ) {
    const auditInfo = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.webhooksService.update(id, updateWebhookDto, auditInfo);
  }

  @ApiOperation({ summary: 'Rotate webhook secret' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook secret rotated successfully. New secret is only shown once!' 
  })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.MEMBER)
  @UseGuards(RolesGuard)
  @Post(':id/rotate-secret')
  rotateSecret(@Param('id') id: string, @Request() req) {
    const auditInfo = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.webhooksService.rotateSecret(id, auditInfo);
  }

  @ApiOperation({ summary: 'Test webhook delivery' })
  @ApiResponse({ status: 200, description: 'Test webhook queued successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.MEMBER)
  @UseGuards(RolesGuard)
  @Post(':id/test')
  testWebhook(@Param('id') id: string) {
    return this.webhooksService.testWebhook(id);
  }

  @ApiOperation({ summary: 'Delete webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER, UserRole.MEMBER)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const auditInfo = {
      userId: req.user.userId,
      companyId: req.user.companyId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.webhooksService.delete(id, auditInfo);
  }
}