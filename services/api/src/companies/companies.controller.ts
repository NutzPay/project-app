import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanyStatusDto } from './dto/company.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole, CompanyStatus } from '@prisma/client';

@ApiTags('Companies')
@ApiBearerAuth('apikey')
@UseGuards(AuthGuard('jwt'))
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @ApiOperation({ summary: 'Create new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.companiesService.create(createCompanyDto, auditInfo);
  }

  @ApiOperation({ summary: 'List all companies' })
  @ApiResponse({ status: 200, description: 'Companies retrieved successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(
    @Query('status') status?: CompanyStatus,
    @Query('planId') planId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.companiesService.findAll({
      status,
      planId,
      limit: limit ? Math.min(limit, 1000) : 100, // Max 1000 records
      offset: offset || 0,
    });
  }

  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company retrieved successfully' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    // Users can only see their own company, unless they are super admin
    const requestedId = req.user.role === UserRole.SUPER_ADMIN ? id : req.user.companyId;
    return this.companiesService.findById(requestedId);
  }

  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req,
  ) {
    // Non-super admins can only update their own company
    const targetId = req.user.role === UserRole.SUPER_ADMIN ? id : req.user.companyId;
    
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.companiesService.update(targetId, updateCompanyDto, auditInfo);
  }

  @ApiOperation({ summary: 'Update company status' })
  @ApiResponse({ status: 200, description: 'Company status updated successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCompanyStatusDto,
    @Request() req,
  ) {
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.companiesService.updateStatus(id, updateStatusDto.status, auditInfo);
  }

  @ApiOperation({ summary: 'Update company plan' })
  @ApiResponse({ status: 200, description: 'Company plan updated successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/plan')
  updatePlan(
    @Param('id') id: string,
    @Body('planId') planId: string,
    @Request() req,
  ) {
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.companiesService.updatePlan(id, planId, auditInfo);
  }

  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @Roles(UserRole.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    const auditInfo = {
      userId: req.user.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    return this.companiesService.delete(id, auditInfo);
  }

  @ApiOperation({ summary: 'Get company statistics' })
  @ApiResponse({ status: 200, description: 'Company statistics retrieved successfully' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @Get('stats')
  getStats(@Request() req) {
    const companyId = req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.companyId;
    return this.companiesService.getStats(companyId);
  }

  @ApiOperation({ summary: 'Get company fee configuration' })
  @ApiResponse({ status: 200, description: 'Company fees retrieved successfully' })
  @Get(':id/fees')
  getFees(@Param('id') id: string, @Request() req) {
    // Users can only see their own company fees, unless they are super admin
    const requestedId = req.user.role === UserRole.SUPER_ADMIN ? id : req.user.companyId;
    return this.companiesService.getFees(requestedId);
  }
}