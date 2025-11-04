import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionTimeoutService } from '../transactions/transaction-timeout.service';

@ApiTags('System Health')
@Controller('health')
export class HealthController {
  constructor(
    private transactionTimeoutService: TransactionTimeoutService
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Basic health check',
    description: 'Returns basic system health information'
  })
  @ApiResponse({
    status: 200,
    description: 'System is healthy'
  })
  async getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'Check scheduled jobs status',
    description: 'Returns information about running scheduled jobs'
  })
  @ApiResponse({
    status: 200,
    description: 'Jobs status retrieved successfully'
  })
  async getJobsHealth() {
    try {
      // Get pending transactions stats to verify job is working
      const stats = await this.transactionTimeoutService.getPendingTransactionsStats();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        jobs: {
          transactionTimeout: {
            enabled: true,
            interval: '5 minutes',
            timeoutMinutes: 15,
            description: 'Checks for expired pending transactions',
            lastStats: stats
          }
        },
        message: 'All scheduled jobs are operational'
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        jobs: {
          transactionTimeout: {
            enabled: false,
            error: error.message
          }
        },
        message: 'Some jobs may not be working properly'
      };
    }
  }

  @Get('trigger-timeout-check')
  @ApiOperation({
    summary: 'Manually trigger timeout check',
    description: 'Manually triggers the transaction timeout check for testing'
  })
  @ApiResponse({
    status: 200,
    description: 'Timeout check triggered successfully'
  })
  async triggerTimeoutCheck() {
    try {
      const result = await this.transactionTimeoutService.checkTimeoutsManually();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        result,
        message: 'Timeout check executed successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        message: 'Error executing timeout check'
      };
    }
  }
}