import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { bettrixService } from '@/lib/bettrix';
import { prisma } from '@/lib/prisma';
import { validatePayoutIP } from '@/lib/ip-validation';
import { getSellerFees } from '@/lib/fee-calculator';
import Decimal from 'decimal.js';

export async function POST(request: NextRequest) {
  try {
    // First, validate the IP address
    const ipValidation = await validatePayoutIP(request);

    // TEMPORARILY DISABLED FOR TESTING
    // if (!ipValidation.isAuthorized) {
    //   console.warn(`Unauthorized PIX payout attempt from IP: ${ipValidation.clientIP}`);

    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'Access denied',
    //       message: 'This IP address is not authorized to perform payout operations'
    //     },
    //     { status: 403 }
    //   );
    // }

    console.log('⚠️ IP Validation temporarily disabled - IP:', ipValidation.clientIP);

    // Validate authentication
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Parse request body
    const { amount, pixKey, pixKeyType: providedPixKeyType, recipientName, recipientDocument, recipientEmail, recipientPhone } = await request.json();

    // Validate required fields
    if (!amount || !pixKey || !recipientName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount, PIX key, and recipient name are required'
        },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Amount must be greater than 0'
        },
        { status: 400 }
      );
    }

    // Get user's PIX wallet
    const pixWallet = await prisma.pIXWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!pixWallet) {
      return NextResponse.json(
        {
          success: false,
          error: 'PIX wallet not found'
        },
        { status: 404 }
      );
    }

    // Get seller fees to calculate total amount needed
    const userFees = await getSellerFees(currentUser.id);
    const feePercentage = (userFees?.pixPayoutFeePercent || 0) / 100; // Convert from percentage to decimal
    const feeFixed = userFees?.pixPayoutFeeFixed || 0;

    // Calculate fee on the withdrawal amount
    const feeAmount = (amount * feePercentage) + feeFixed;
    const totalAmountNeeded = amount + feeAmount;

    console.log('💰 PIX Payout Fee Calculation:', {
      requestedAmount: amount,
      feePercentage: feePercentage * 100 + '%',
      feeFixed: feeFixed,
      feeAmount: feeAmount,
      totalAmountNeeded: totalAmountNeeded,
      currentBalance: pixWallet.balance.toNumber()
    });

    // Check if user has sufficient balance (requested amount + fee)
    if (pixWallet.balance.lt(totalAmountNeeded)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient balance',
          details: {
            requestedAmount: amount,
            feeAmount: feeAmount,
            totalNeeded: totalAmountNeeded,
            currentBalance: pixWallet.balance.toNumber(),
            message: `Saldo insuficiente. Você precisa de R$ ${totalAmountNeeded.toFixed(2)} (R$ ${amount.toFixed(2)} + R$ ${feeAmount.toFixed(2)} de taxa), mas tem apenas R$ ${pixWallet.balance.toNumber().toFixed(2)}`
          }
        },
        { status: 400 }
      );
    }

    // Get user details for fallback
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        email: true,
        document: true,
        name: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não encontrado'
        },
        { status: 404 }
      );
    }

    // Validate CPF if provided (basic check for 11 digits)
    const cleanDoc = (recipientDocument || user.document || '').replace(/\D/g, '');
    const isValidCPF = cleanDoc.length === 11;

    console.log('📋 Recipient info:', {
      recipientDocument: recipientDocument,
      userDocument: user.document,
      cleanDoc,
      isValidCPF
    });

    console.log('🔄 Creating PIX payout via Bettrix...');
    console.log('📋 Data:', { amount, pixKey: pixKey.substring(0, 5) + '***', recipientName });

    // Generate unique order ID
    const orderId = `nutz_payout_${Date.now()}_${currentUser.id}`;

    // Use provided PIX key type, or determine automatically as fallback
    let pixKeyTypeString: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

    if (providedPixKeyType !== undefined) {
      // Convert number to string
      const pixKeyTypeMap = ['cpf', 'cnpj', 'email', 'phone', 'random'] as const;
      pixKeyTypeString = pixKeyTypeMap[providedPixKeyType];
    } else {
      pixKeyTypeString = bettrixService.determinePixKeyType(pixKey);
    }

    console.log('🔑 PIX Key Type:', {
      providedByFrontend: providedPixKeyType,
      finalType: pixKeyTypeString,
      keyPreview: pixKey.substring(0, 5) + '***'
    });

    try {
      // Create PIX payout via Bettrix
      const bettrixResponse = await bettrixService.createCashOut({
        amount: amount,
        pixKey: pixKey,
        pixKeyType: pixKeyTypeString,
        recipientDocument: isValidCPF ? cleanDoc : '',
        recipientName: recipientName || user.name || 'Usuario Nutz',
        recipientEmail: recipientEmail || user.email || `user${currentUser.id}@nutz.com`,
        recipientPhone: recipientPhone || '11999999999',
        orderId: orderId,
        postbackUrl: `${process.env.NEXTAUTH_URL}/api/bettrix/webhook/cashout`
      });

      // Create payout transaction in database
      const transaction = await prisma.$transaction(async (tx) => {
        // Create the transaction record (balance will be updated after)
        const payoutTransaction = await tx.pIXTransaction.create({
          data: {
            walletId: pixWallet.id,
            type: 'WITHDRAWAL',
            status: 'PENDING',
            amount: amount,
            balanceAfter: pixWallet.balance.minus(totalAmountNeeded), // Temporary, will be updated below
            pixKey: pixKey,
            description: `PIX Payout to ${recipientName}`,
            externalId: orderId,
            endToEndId: bettrixResponse.transactionId.toString(),
            metadata: JSON.stringify({
              bettrixTransactionId: bettrixResponse.transactionId,
              bettrixOrderId: bettrixResponse.orderId,
              pixKeyType: pixKeyTypeString,
              recipientName,
              recipientDocument,
              authorizedIP: ipValidation.clientIP,
              processedBy: currentUser.id,
              provider: 'bettrix',
              gross: bettrixResponse.gross,
              tax: bettrixResponse.tax,
              liquid: bettrixResponse.liquid,
              timestamp: new Date().toISOString()
            })
          }
        });

        // Update wallet balance - deduct total amount (requested + fee)
        const newBalance = pixWallet.balance.minus(totalAmountNeeded);
        await tx.pIXWallet.update({
          where: { id: pixWallet.id },
          data: {
            balance: newBalance,
            totalWithdrawn: pixWallet.totalWithdrawn.plus(amount) // Only the requested amount goes here
          }
        });

        // Update transaction with correct balance and fee info
        await tx.pIXTransaction.update({
          where: { id: payoutTransaction.id },
          data: {
            balanceAfter: newBalance,
            metadata: JSON.stringify({
              bettrixTransactionId: bettrixResponse.transactionId,
              bettrixOrderId: bettrixResponse.orderId,
              pixKeyType: pixKeyTypeString,
              recipientName,
              recipientDocument,
              authorizedIP: ipValidation.clientIP,
              processedBy: currentUser.id,
              provider: 'bettrix',
              gross: bettrixResponse.gross,
              tax: bettrixResponse.tax,
              liquid: bettrixResponse.liquid,
              timestamp: new Date().toISOString(),
              feeCalculation: {
                requestedAmount: amount,
                feeAmount: feeAmount,
                totalDeducted: totalAmountNeeded,
                feeBreakdown: {
                  percentageFee: amount * feePercentage,
                  fixedFee: feeFixed
                }
              }
            })
          }
        });

        return payoutTransaction;
      });

      // Log successful payout
      console.log({
        level: 'info',
        event: 'bettrix_pix_payout_created',
        transactionId: transaction.id,
        bettrixTransactionId: bettrixResponse.transactionId,
        requestedAmount: amount.toString(),
        feeAmount: feeAmount.toString(),
        totalDeducted: totalAmountNeeded.toString(),
        userId: currentUser.id,
        authorizedIP: ipValidation.clientIP,
        pixKey: pixKey.substring(0, 5) + '***',
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction.id,
          bettrixTransactionId: bettrixResponse.transactionId,
          orderId: bettrixResponse.orderId,
          amount: transaction.amount,
          status: bettrixService.mapStatus(bettrixResponse.status),
          pixKey: pixKey.substring(0, 5) + '***',
          gross: bettrixResponse.gross,
          tax: parseFloat(bettrixResponse.tax),
          liquid: parseFloat(bettrixResponse.liquid),
          createdAt: transaction.createdAt,
          feeInfo: {
            requestedAmount: amount,
            feeAmount: feeAmount,
            totalDeducted: totalAmountNeeded,
            feePercentage: feePercentage * 100,
            feeFixed: feeFixed
          }
        },
        message: 'PIX payout initiated successfully via Bettrix'
      });

    } catch (bettrixError) {
      console.error('❌ Bettrix payout error:', bettrixError);

      return NextResponse.json(
        {
          success: false,
          error: bettrixError instanceof Error ? bettrixError.message : 'Error creating payout via Bettrix'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error processing PIX payout:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}