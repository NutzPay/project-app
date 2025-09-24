import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { walletService } from '@/lib/walletService';

export async function POST(request: NextRequest) {
  try {
    const { pixTransactionId, action } = await request.json();
    
    if (!pixTransactionId) {
      return NextResponse.json({
        success: false,
        error: 'PIX Transaction ID é obrigatório'
      });
    }

    console.log(`🔧 Manual processing: ${action} for PIX ID: ${pixTransactionId}`);

    if (action === 'debug') {
      // Buscar todas as transações relacionadas
      const transactions = await prisma.uSDTTransaction.findMany({
        where: {
          OR: [
            { pixTransactionId: pixTransactionId },
            { externalId: pixTransactionId },
            { id: pixTransactionId }
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

      return NextResponse.json({
        success: true,
        action: 'debug',
        pixTransactionId,
        transactionsFound: transactions.length,
        transactions: transactions.map(tx => ({
          id: tx.id,
          pixTransactionId: tx.pixTransactionId,
          externalId: tx.externalId,
          type: tx.type,
          status: tx.status,
          amount: Number(tx.amount),
          brlAmount: Number(tx.brlAmount || 0),
          exchangeRate: Number(tx.exchangeRate || 0),
          description: tx.description,
          createdAt: tx.createdAt,
          processedAt: tx.processedAt,
          user: tx.wallet.user,
          walletBalance: Number(tx.wallet.balance)
        }))
      });
    }

    if (action === 'complete') {
      try {
        console.log('🔄 Attempting to complete pending transaction...');
        
        const result = await walletService.completePendingTransaction(pixTransactionId);
        
        console.log('✅ Manual completion successful:', result);
        
        return NextResponse.json({
          success: true,
          action: 'complete',
          pixTransactionId,
          result,
          message: 'Transação processada manualmente com sucesso!'
        });
        
      } catch (error) {
        console.error('❌ Manual completion failed:', error);
        
        // Verificar se a transação existe mas com status diferente
        const existingTx = await prisma.uSDTTransaction.findFirst({
          where: {
            OR: [
              { pixTransactionId: pixTransactionId },
              { externalId: pixTransactionId }
            ]
          },
          include: {
            wallet: {
              include: {
                user: true
              }
            }
          }
        });

        return NextResponse.json({
          success: false,
          action: 'complete',
          pixTransactionId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          existingTransaction: existingTx ? {
            id: existingTx.id,
            status: existingTx.status,
            amount: Number(existingTx.amount),
            user: existingTx.wallet.user.email,
            createdAt: existingTx.createdAt
          } : null,
          suggestion: existingTx?.status === 'COMPLETED' 
            ? 'Transação já foi processada anteriormente' 
            : 'Transação não encontrada ou em status inválido'
        });
      }
    }

    if (action === 'fix_amount') {
      // Corrigir o valor USDT da transação (de 0.17 para valor correto)
      const { correctUsdtAmount } = await request.json();
      
      if (!correctUsdtAmount) {
        return NextResponse.json({
          success: false,
          error: 'correctUsdtAmount é obrigatório para fix_amount'
        });
      }

      const updatedTx = await prisma.uSDTTransaction.updateMany({
        where: {
          OR: [
            { pixTransactionId: pixTransactionId },
            { externalId: pixTransactionId }
          ],
          status: 'PENDING'
        },
        data: {
          amount: correctUsdtAmount
        }
      });

      return NextResponse.json({
        success: true,
        action: 'fix_amount',
        pixTransactionId,
        correctUsdtAmount,
        updatedCount: updatedTx.count,
        message: `Valor USDT corrigido para ${correctUsdtAmount}`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ação inválida. Use: debug, complete, ou fix_amount'
    });

  } catch (error) {
    console.error('❌ Manual processing error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro no processamento manual'
    });
  }
}