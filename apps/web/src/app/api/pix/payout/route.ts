import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { validatePayoutIP } from '@/lib/ip-validation';

export async function POST(request: NextRequest) {
  try {
    // First, validate the IP address
    const ipValidation = await validatePayoutIP(request);
    
    if (!ipValidation.isAuthorized) {
      console.warn(`Unauthorized PIX payout attempt from IP: ${ipValidation.clientIP}`);
      
      // Log this security event
      console.log({
        level: 'security',
        event: 'unauthorized_pix_payout_attempt',
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
    const { amount, pixKey, recipientName } = await request.json();

    // Validate required fields
    if (!amount || !pixKey) {
      return NextResponse.json(
        { error: 'Amount and PIX key are required' },
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

    // Get user's PIX wallet
    const pixWallet = await prisma.pIXWallet.findUnique({
      where: { userId: user.id }
    });

    if (!pixWallet) {
      return NextResponse.json(
        { error: 'PIX wallet not found' },
        { status: 404 }
      );
    }

    // Check if user has sufficient balance
    if (pixWallet.balance.lt(amount)) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create payout transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Create the transaction record
      const payoutTransaction = await tx.pIXTransaction.create({
        data: {
          walletId: pixWallet.id,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          amount: amount,
          balanceAfter: pixWallet.balance.minus(amount),
          pixKey: pixKey,
          description: `PIX Payout to ${recipientName || pixKey}`,
          metadata: JSON.stringify({
            pixKey,
            recipientName,
            authorizedIP: ipValidation.clientIP,
            processedBy: user.id,
            timestamp: new Date().toISOString()
          })
        }
      });

      // Update wallet balance
      await tx.pIXWallet.update({
        where: { id: pixWallet.id },
        data: {
          balance: pixWallet.balance.minus(amount),
          totalWithdrawn: pixWallet.totalWithdrawn.plus(amount)
        }
      });

      return payoutTransaction;
    });

    // Log successful payout
    console.log({
      level: 'info',
      event: 'pix_payout_created',
      transactionId: transaction.id,
      amount: amount.toString(),
      userId: user.id,
      authorizedIP: ipValidation.clientIP,
      pixKey: pixKey.substring(0, 5) + '***', // Partially obscure PIX key for security
      timestamp: new Date().toISOString()
    });

    // In a real implementation, you would integrate with StarkBank or another PIX provider here
    // For now, we'll just simulate the payout process

    // Update transaction status to processing
    await prisma.pIXTransaction.update({
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
        pixKey: pixKey.substring(0, 5) + '***', // Partially obscure for response
        createdAt: transaction.createdAt
      },
      message: 'PIX payout initiated successfully'
    });

  } catch (error) {
    console.error('Error processing PIX payout:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}