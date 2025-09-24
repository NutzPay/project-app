import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole, AuditAction } from '@prisma/client';

@ApiTags('Audit')
@ApiBearerAuth('apikey')
@UseGuards(AuthGuard('jwt'))
@Controller('audit')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get()
  async findAll(
    @Request() req,
    @Query('action') action?: AuditAction,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const companyId = req.user.role === UserRole.SUPER_ADMIN 
      ? undefined 
      : req.user.companyId;

    return this.auditService.findAll({
      companyId,
      action,
      resource,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? Math.min(limit, 1000) : 100, // Max 1000 records
      offset: offset || 0,
    });
  }

  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findById(id);
  }

  @ApiOperation({ summary: 'Get audit statistics' })
  @ApiResponse({ status: 200, description: 'Audit statistics retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const companyId = req.user.role === UserRole.SUPER_ADMIN 
      ? undefined 
      : req.user.companyId;

    return this.auditService.getStats(companyId);
  }
}