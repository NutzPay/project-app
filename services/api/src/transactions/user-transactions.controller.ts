import {
  Controller,
  Get,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../common/prisma/prisma.service';

@ApiTags('User Transactions')
@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class UserTransactionsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user transactions',
    description: 'Returns paginated list of user transactions from all types'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Transaction type filter (USDT, PIX, INVESTMENT)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Transaction status filter' })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully'
  })
  async getUserTransactions(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const userId = req.user?.id;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    try {
      const transactions = [];

      // Get USDT transactions
      if (!type || type === 'USDT') {
        const usdtWallet = await this.prisma.uSDTWallet.findUnique({
          where: { userId },
        });

        if (usdtWallet) {
          const statusFilter = status ? { equals: status as any } : undefined;
          const usdtTransactions = await this.prisma.uSDTTransaction.findMany({
            where: {
              walletId: usdtWallet.id,
              ...(statusFilter && { status: statusFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          });

          transactions.push(
            ...usdtTransactions.map((tx) => ({
              id: tx.id,
              type: 'USDT',
              subtype: tx.type,
              status: tx.status,
              amount: tx.amount,
              description: tx.description,
              createdAt: tx.createdAt,
              processedAt: tx.processedAt,
              updatedAt: tx.updatedAt,
            }))
          );
        }
      }

      // Get PIX transactions
      if (!type || type === 'PIX') {
        const pixWallet = await this.prisma.pIXWallet.findUnique({
          where: { userId },
        });

        if (pixWallet) {
          const statusFilter = status ? { equals: status as any } : undefined;
          const pixTransactions = await this.prisma.pIXTransaction.findMany({
            where: {
              walletId: pixWallet.id,
              ...(statusFilter && { status: statusFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          });

          transactions.push(
            ...pixTransactions.map((tx) => ({
              id: tx.id,
              type: 'PIX',
              subtype: tx.type,
              status: tx.status,
              amount: tx.amount,
              description: tx.description,
              createdAt: tx.createdAt,
              processedAt: tx.processedAt,
              updatedAt: tx.updatedAt,
            }))
          );
        }
      }

      // Get Investment transactions
      if (!type || type === 'INVESTMENT') {
        const investmentWallet = await this.prisma.investmentWallet.findUnique({
          where: { userId },
        });

        if (investmentWallet) {
          const statusFilter = status ? { equals: status as any } : undefined;
          const investmentTransactions = await this.prisma.investmentTransaction.findMany({
            where: {
              walletId: investmentWallet.id,
              ...(statusFilter && { status: statusFilter }),
            },
            orderBy: { createdAt: 'desc' },
            take: limitNum,
            skip: offset,
          });

          transactions.push(
            ...investmentTransactions.map((tx) => ({
              id: tx.id,
              type: 'INVESTMENT',
              subtype: tx.type,
              status: tx.status,
              amount: tx.amount,
              description: tx.description,
              createdAt: tx.createdAt,
              processedAt: tx.processedAt,
              updatedAt: tx.updatedAt,
            }))
          );
        }
      }

      // Sort all transactions by createdAt descending
      transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Apply pagination to the combined results
      const paginatedTransactions = transactions.slice(offset, offset + limitNum);
      const total = transactions.length;
      const totalPages = Math.ceil(total / limitNum);

      return {
        success: true,
        data: {
          transactions: paginatedTransactions,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
          }
        },
        message: 'Transactions retrieved successfully'
      };

    } catch (error) {
      console.error('Error fetching user transactions:', error);
      return {
        success: false,
        error: 'Failed to fetch transactions',
        message: error.message
      };
    }
  }
}