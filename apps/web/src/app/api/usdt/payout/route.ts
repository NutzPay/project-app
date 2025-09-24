import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { validatePayoutIP } from '@/lib/ip-validation';

export async function POST(request: NextRequest) {
  try {
    // First, validate the IP address
    const ipValidation = await validatePayoutIP(request);
    
    if (!ipValidation.isAuthorized) {
      console.warn(`Unauthorized payout attempt from IP: ${ipValidation.clientIP}`);
      
      // Log this security event
      console.log({
        level: 'security',
        event: 'unauthorized_payout_attempt',
        ip: ipValidation.clientIP,
        timestamp: new Date().toISOString(),
        error: ipValidation.error
      });
      
      return NextResponse.json(
        { 
          error: 'Access denied',
          message: 'This IP address is not authorized to perform payout operations'
        },
        { status: 403 }
      );
    }

    // Validate authentication
    const user = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const { amount, recipientAddress, recipientName } = await request.json();

    // Validate required fields
    if (!amount || !recipientAddress) {
      return NextResponse.json(
        { error: 'Amount and recipient address are required' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user's USDT wallet
    const usdtWallet = await prisma.uSDTWallet.findUnique({
      where: { userId: user.id }
    });

    if (!usdtWallet) {
      return NextResponse.json(
        { error: 'USDT wallet not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (usdtWallet.balance.lt(amount)) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create payout transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const payoutTransaction = await tx.uSDTTransaction.create({
        data: {
          walletId: usdtWallet.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: amount,
          balanceAfter: usdtWallet.balance.minus(amount),
          description: `USDT Payout to ${recipientName || recipientAddress}`,
          metadata: JSON.stringify({
            recipientAddress,
            recipientName,
            authorizedIP: ipValidation.clientIP,
            processedBy: user.id,
            timestamp: new Date().toISOString()
          })
        }
      });

      // Update wallet balance
      await tx.uSDTWallet.update({
        where: { id: usdtWallet.id },
        data: {
          balance: usdtWallet.balance.minus(amount),
          totalWithdrawn: usdtWallet.totalWithdrawn.plus(amount)
        }
      });

      return payoutTransaction;
    });

    // Log successful payout
    console.log({
      level: 'info',
      event: 'usdt_payout_created',
      transactionId: transaction.id,
      amount: amount.toString(),
      userId: user.id,
      authorizedIP: ipValidation.clientIP,
      recipientAddress,
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would integrate with a USDT payment provider here
    // For now, we'll just simulate the payout process

    // Update transaction status to processing
    await prisma.uSDTTransaction.update({
      where: { id: transaction.id },
      data: { 
        status: 'PROCESSING',
        processedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: 'PROCESSING',
        recipientAddress,
        createdAt: transaction.createdAt
      },
      message: 'Payout initiated successfully'
    });

  } catch (error) {
    console.error('Error processing USDT payout:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}