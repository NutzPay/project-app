import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { bettrixService } from '@/lib/bettrix';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('💲 USDT purchase endpoint called');

    const currentUser = await getCurrentUser(request);
    console.log('👤 Current user:', currentUser);

    if (!currentUser) {
      console.log('❌ User not authenticated');
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const { usdtAmount, brlAmount, exchangeRate, payerName, payerDocument } = await request.json();

    // Validate input
    if (!usdtAmount || !brlAmount || !exchangeRate || !payerName || !payerDocument) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: usdtAmount, brlAmount, exchangeRate, payerName, payerDocument'
        },
        { status: 400 }
      );
    }

    if (parseFloat(usdtAmount) <= 0 || parseFloat(brlAmount) <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valores devem ser maiores que zero'
        },
        { status: 400 }
      );
    }

    // Validate Bettrix transaction limit (R$ 500 maximum)
    if (parseFloat(brlAmount) > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'O valor máximo por transação é de R$ 500,00. Por favor, reduza a quantidade de USDT.',
          code: 'AMOUNT_LIMIT_EXCEEDED'
        },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        email: true,
        document: true,
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

    console.log('💰 Creating USDT purchase PIX via Bettrix...');
    console.log('📋 Data:', { usdtAmount, brlAmount, exchangeRate, payerName, payerDocument });

    // Generate unique order ID for USDT purchase (keeping it short like PIX)
    const orderId = `nutz-usdt-${Date.now()}`;

    // Create PIX via Bettrix for USDT purchase
    const bettrixResponse = await bettrixService.createCashIn({
      amount: parseFloat(brlAmount),
      payerName: payerName,
      payerDocument: payerDocument.replace(/\D/g, ''),
      payerEmail: 'pagamento@nutzpay.com', // Use same hardcoded email as PIX direct
      payerPhone: '11999999999', // Default phone
      description: 'Deposito via PIX', // Use same simple description as PIX direct
      orderId: orderId,
      postbackUrl: 'https://nutzpay.com/api/bettrix/webhook/cashin'
    });

    // Get or create USDT wallet
    let usdtWallet = await prisma.uSDTWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!usdtWallet) {
      usdtWallet = await prisma.uSDTWallet.create({
        data: {
          userId: currentUser.id
        }
      });
    }

    // Create USDT transaction record (will be completed when PIX is paid)
    const usdtTransaction = await prisma.uSDTTransaction.create({
      data: {
        walletId: usdtWallet.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: parseFloat(usdtAmount),
        balanceAfter: usdtWallet.balance, // Will be updated when payment is confirmed
        brlAmount: parseFloat(brlAmount),
        exchangeRate: parseFloat(exchangeRate),
        description: `Compra de USDT via PIX`,
        externalId: orderId,
        pixTransactionId: bettrixResponse.transactionId.toString(),
        metadata: JSON.stringify({
          bettrixTransactionId: bettrixResponse.transactionId,
          bettrixExternalId: bettrixResponse.externalId,
          payerName: payerName,
          payerDocument: payerDocument,
          provider: 'bettrix',
          purchaseType: 'usdt_via_pix'
        })
      }
    });

    const purchaseResponse = {
      id: bettrixResponse.transactionId.toString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(bettrixResponse.qrCode)}`,
      qrCodeText: bettrixResponse.qrCode,
      qrCodeBase64: bettrixResponse.qrCodeBase64,
      brlAmount: parseFloat(brlAmount),
      usdtAmount: parseFloat(usdtAmount),
      exchangeRate: parseFloat(exchangeRate),
      status: 'created',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      transactionId: usdtTransaction.id,
      orderId: orderId,
      createdAt: new Date(),
    };

    console.log('✅ USDT purchase PIX created successfully via Bettrix:', bettrixResponse.transactionId);
    return NextResponse.json({
      success: true,
      ...purchaseResponse
    });

  } catch (error) {
    console.error('❌ Error creating USDT purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno ao gerar compra de USDT'
      },
      { status: 500 }
    );
  }
}