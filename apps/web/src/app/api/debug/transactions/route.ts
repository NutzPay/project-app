import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { walletService } from '@/lib/walletService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pixId = searchParams.get('pixId');
    const userId = searchParams.get('userId');
    
    console.log('🔍 Debug request:', { pixId, userId });

    // Buscar todas as transações recentes
    const recentTransactions = await prisma.uSDTTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    console.log('📋 Recent transactions found:', recentTransactions.length);

    // Buscar transação específica se PIX ID fornecido
    let specificTransaction = null;
    if (pixId) {
      specificTransaction = await prisma.uSDTTransaction.findFirst({
        where: {
          OR: [
            { pixTransactionId: pixId },
            { externalId: pixId },
            { id: pixId }
          ]
        },
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });
      
      console.log('🎯 Specific transaction:', specificTransaction ? 'Found' : 'Not found');
    }

    // Buscar carteiras se userId fornecido
    let userWallet = null;
    if (userId) {
      userWallet = await prisma.uSDTWallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      debug: {
        pixId,
        userId,
        timestamp: new Date().toISOString()
      },
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        pixTransactionId: tx.pixTransactionId,
        externalId: tx.externalId,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amount),
        brlAmount: Number(tx.brlAmount || 0),
        createdAt: tx.createdAt,
        processedAt: tx.processedAt,
        user: {
          id: tx.wallet.user.id,
          name: tx.wallet.user.name,
          email: tx.wallet.user.email
        },
        wallet: {
          id: tx.wallet.id,
          balance: Number(tx.wallet.balance),
          totalDeposited: Number(tx.wallet.totalDeposited)
        }
      })),
      specificTransaction: specificTransaction ? {
        id: specificTransaction.id,
        pixTransactionId: specificTransaction.pixTransactionId,
        externalId: specificTransaction.externalId,
        type: specificTransaction.type,
        status: specificTransaction.status,
        amount: Number(specificTransaction.amount),
        brlAmount: Number(specificTransaction.brlAmount || 0),
        exchangeRate: Number(specificTransaction.exchangeRate || 0),
        description: specificTransaction.description,
        createdAt: specificTransaction.createdAt,
        processedAt: specificTransaction.processedAt,
        user: {
          id: specificTransaction.wallet.user.id,
          name: specificTransaction.wallet.user.name,
          email: specificTransaction.wallet.user.email
        },
        wallet: {
          id: specificTransaction.wallet.id,
          balance: Number(specificTransaction.wallet.balance),
          totalDeposited: Number(specificTransaction.wallet.totalDeposited)
        }
      } : null,
      userWallet: userWallet ? {
        id: userWallet.id,
        balance: Number(userWallet.balance),
        frozenBalance: Number(userWallet.frozenBalance),
        totalDeposited: Number(userWallet.totalDeposited),
        totalWithdrawn: Number(userWallet.totalWithdrawn),
        user: userWallet.user
      } : null
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug error',
      timestamp: new Date().toISOString()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, pixTransactionId } = await request.json();
    
    if (action === 'retry_webhook' && pixTransactionId) {
      console.log('🔄 Retrying webhook processing for:', pixTransactionId);
      
      try {
        const result = await walletService.completePendingTransaction(pixTransactionId);
        
        return NextResponse.json({
          success: true,
          action: 'retry_webhook',
          pixTransactionId,
          result,
          message: 'Webhook processado manualmente com sucesso'
        });
        
      } catch (error) {
        console.error('❌ Manual webhook retry failed:', error);
        
        return NextResponse.json({
          success: false,
          action: 'retry_webhook',
          pixTransactionId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          message: 'Falha ao processar webhook manualmente'
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Ação inválida ou parâmetros em falta'
    });

  } catch (error) {
    console.error('❌ Debug POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug POST error'
    });
  }
}