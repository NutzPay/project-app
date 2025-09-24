import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TransactionTimeoutService } from './transaction-timeout.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('Transactions Management')
@Controller('admin/transactions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
export class TransactionsController {
  constructor(
    private transactionTimeoutService: TransactionTimeoutService,
    private prisma: PrismaService,
  ) {}

  @Get('pending-stats')
  @ApiOperation({
    summary: 'Get pending transactions statistics',
    description: 'Returns statistics about pending and expired transactions'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully'
  })
  async getPendingTransactionsStats() {
    const stats = await this.transactionTimeoutService.getPendingTransactionsStats();

    return {
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    };
  }

  @Post('check-timeouts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger timeout check',
    description: 'Manually triggers the timeout verification process for pending transactions'
  })
  @ApiResponse({
    status: 200,
    description: 'Timeout check executed successfully'
  })
  async checkTimeoutsManually() {
    const result = await this.transactionTimeoutService.checkTimeoutsManually();

    return {
      success: true,
      data: result,
      message: 'Timeout check executed successfully'
    };
  }

  @Get('timeout-config')
  @ApiOperation({
    summary: 'Get timeout configuration',
    description: 'Returns current timeout configuration settings'
  })
  @ApiResponse({
    status: 200,
    description: 'Configuration retrieved successfully'
  })
  async getTimeoutConfig() {
    return {
      success: true,
      data: {
        timeoutMinutes: 15,
        checkInterval: '5 minutes',
        status: 'active',
        lastCheck: new Date().toISOString(),
        description: 'Transactions pending for more than 15 minutes will be automatically marked as failed'
      },
      message: 'Configuration retrieved successfully'
    };
  }
}