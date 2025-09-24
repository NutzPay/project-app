import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { StarkBankService } from './starkbank.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Stark Bank Integration')
@ApiBearerAuth('apikey')
@UseGuards(AuthGuard('jwt'))
@Controller('integrations/starkbank')
export class StarkBankController {
  constructor(private starkBankService: StarkBankService) {}

  @ApiOperation({ summary: 'Get Stark Bank integration status and setup guide' })
  @ApiResponse({ status: 200, description: 'Integration status retrieved successfully' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get('status')
  getStatus() {
    return this.starkBankService.getIntegrationStatus();
  }

  @ApiOperation({ summary: 'Get account balance (placeholder)' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 501, description: 'Integration not configured' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get('balance')
  getBalance() {
    return this.starkBankService.getBalance();
  }

  @ApiOperation({ summary: 'Create payment (placeholder)' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 501, description: 'Integration not configured' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Post('payments')
  createPayment(@Body() paymentData: any) {
    return this.starkBankService.createPayment(paymentData);
  }

  @ApiOperation({ summary: 'Get payment by ID (placeholder)' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 501, description: 'Integration not configured' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get('payments/:id')
  getPayment(@Param('id') id: string) {
    return this.starkBankService.getPayment(id);
  }

  @ApiOperation({ summary: 'List payments (placeholder)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  @ApiResponse({ status: 501, description: 'Integration not configured' })
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER)
  @UseGuards(RolesGuard)
  @Get('payments')
  listPayments(
    @Query('limit') limit?: number,
    @Query('after') after?: string,
    @Query('before') before?: string,
    @Query('status') status?: string,
  ) {
    return this.starkBankService.listPayments({
      limit: limit || 20,
      after,
      before,
      status,
    });
  }

  @ApiOperation({ summary: 'Create PIX QR Code for deposit' })
  @ApiResponse({ status: 201, description: 'PIX QR Code created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 501, description: 'Starkbank integration not configured' })
  @Post('pix/create')
  createPixDeposit(@Body() createPixDto: {
    amount: number;
    name: string;
    taxId: string;
    description: string;
    externalId?: string;
  }) {
    return this.starkBankService.createPixDeposit(createPixDto);
  }

  @ApiOperation({ summary: 'Get PIX status by ID' })
  @ApiResponse({ status: 200, description: 'PIX status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'PIX not found' })
  @Get('pix/:id')
  getPixStatus(@Param('id') id: string) {
    return this.starkBankService.getPixStatus(id);
  }
}