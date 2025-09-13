import { NextRequest, NextResponse } from 'next/server';
import { getXGateService } from '@/lib/xgate';
import { walletService } from '@/lib/walletService';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { priceCalculator } from '@/lib/priceCalculator';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const { amount, usdtAmount, name, taxId, description, externalId } = await request.json();

    // Validate input
    if (!amount || !name || !taxId || !description) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campos obrigatórios: amount, name, taxId, description',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (amount < 1) { // Minimum R$1 BRL
      return NextResponse.json(
        { 
          success: false,
          error: 'Valor mínimo para compra de USDT é R$ 1,00',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    console.log('🏦 Creating real USDT purchase via XGate...');
    console.log('📋 Data:', { 
      amount: `R$ ${amount}`,
      usdtAmount: usdtAmount ? `${usdtAmount} USDT` : 'TBD',
      name,
      taxId: `${taxId.substring(0, 3)}***`,
      description
    });

    try {
      const xgateService = getXGateService();
      
      // Initialize XGate service (load currencies/cryptos)
      console.log('🔧 Initializing XGate service...');
      const initialized = await xgateService.loadCurrenciesAndCryptos();
      
      if (!initialized) {
        throw new Error('Failed to initialize XGate service - currencies/cryptos not loaded');
      }

      // Get BRL currency and USDT crypto IDs
      const brlCurrency = xgateService.getBRLCurrency();
      const usdtCrypto = xgateService.getUSDTCrypto();

      if (!brlCurrency) {
        throw new Error('BRL/PIX currency not available on XGate');
      }

      if (!usdtCrypto) {
        throw new Error('USDT cryptocurrency not available on XGate');
      }

      console.log('💰 Found currencies:', {
        brl: `${brlCurrency.name} (${brlCurrency._id || brlCurrency.id})`,
        usdt: `${usdtCrypto.name} (${usdtCrypto._id || usdtCrypto.id})`
      });

      // Try to get quote for BRL → USDT conversion (optional for some accounts)
      console.log('💱 Attempting to get conversion quote...');
      const quote = await xgateService.getQuote(amount);
      
      // Usar nova calculadora de preços com CoinMarketCap + taxa do seller
      console.log('💰 Using new price calculator with CoinMarketCap data...');
      const priceCalculation = await priceCalculator.calculateUSDTAmount(amount, currentUser.id);
      
      console.log('💱 Price calculation result:', {
        userId: currentUser.id,
        brlAmount: amount,
        usdtAmount: priceCalculation.usdtAmount,
        usdtPrice: priceCalculation.usdtPrice,
        sellerFee: priceCalculation.sellerFee,
        pricePerUsdt: priceCalculation.pricePerUsdt
      });
      
      const calculatedUsdtAmount = priceCalculation.usdtAmount;
      const exchangeRate = 1 / priceCalculation.pricePerUsdt; // Converter para formato compatível
      
      if (quote.success && quote.data) {
        console.log('✅ XGate Quote received (informational only):', {
          from: `R$ ${quote.data.fromAmount}`,
          to: `${quote.data.toAmount} USDT`,
          rate: quote.data.rate,
          note: 'Using CoinMarketCap + seller fee instead'
        });
      } else {
        console.log('ℹ️ XGate quote not available, using CoinMarketCap + seller fee');
      }

      // Create or get customer
      console.log('👤 Creating/getting customer...');
      const customerId = await xgateService.createOrGetCustomer(
        name,
        `customer_${Date.now()}@nutzbeta.temp`, // Temp email for now
        taxId.replace(/\D/g, '')
      );

      if (!customerId) {
        throw new Error('Failed to create/get customer on XGate');
      }

      console.log('✅ Customer ID:', customerId);

      // Create deposit order
      console.log('💳 Creating deposit order...');
      const depositResult = await xgateService.createDeposit({
        customerId: customerId,
        currencyId: brlCurrency._id,
        cryptoId: usdtCrypto._id,
        amount: amount,
        description: description,
        webhookUrl: process.env.XGATE_WEBHOOK_URL || 'https://2b8d13184f99.ngrok.app/api/xgate/webhook'
      });

      if (!depositResult.success || !depositResult.data) {
        throw new Error(`Deposit creation failed: ${depositResult.error}`);
      }

      console.log('✅ Deposit created:', depositResult.data.id);

      // Create pending transaction in database
      try {
        // Using authenticated user ID
        const userId = currentUser.id;
        
        await walletService.createPendingTransaction({
          userId: userId,
          type: 'DEPOSIT',
          amount: calculatedUsdtAmount,
          pixCode: depositResult.data.pixCode,
          pixTransactionId: depositResult.data.id,
          brlAmount: amount,
          exchangeRate: exchangeRate,
          description: description,
          externalId: depositResult.data.id
        });

        console.log('✅ Pending transaction created in database:', {
          userId: currentUser.id,
          userEmail: currentUser.email,
          pixTransactionId: depositResult.data.id,
          usdtAmount: calculatedUsdtAmount
        });
      } catch (dbError) {
        console.error('⚠️ Failed to create pending transaction in database:', dbError);
        // Continue anyway - the webhook can still process the payment
      }

      // Generate QR Code URL if not provided
      let qrCodeUrl = depositResult.data.qrCodeUrl;
      if (!qrCodeUrl && depositResult.data.pixCode) {
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(depositResult.data.pixCode)}`;
      }

      // Return standardized response
      const response = {
        success: true,
        pixCode: depositResult.data.pixCode,
        transactionId: depositResult.data.id,
        status: depositResult.data.status,
        amount: depositResult.data.amount,
        usdtAmount: depositResult.data.cryptoAmount,
        expiresAt: depositResult.data.expiresAt,
        qrCodeUrl: qrCodeUrl,
        // Legacy fields for compatibility
        id: depositResult.data.id,
        qrCodeText: depositResult.data.pixCode,
        exchangeRate: exchangeRate,
        createdAt: new Date().toISOString(),
        type: 'usdt_purchase',
        provider: 'xgate'
      };

      console.log('🎉 USDT order created successfully!');
      console.log('📊 Final response:', {
        id: response.id,
        amount: `R$ ${response.amount}`,
        usdt: `${response.usdtAmount} USDT`,
        status: response.status
      });

      return NextResponse.json(response);

    } catch (xgateError) {
      console.error('❌ XGate integration error:', xgateError);
      
      const errorMessage = (xgateError as Error).message;
      let errorCode = 'XGATE_ERROR';
      
      if (errorMessage.includes('Authentication') || errorMessage.includes('credentials')) {
        errorCode = 'AUTH_ERROR';
      } else if (errorMessage.includes('not available') || errorMessage.includes('not found')) {
        errorCode = 'VALIDATION_ERROR';
      }

      return NextResponse.json(
        { 
          success: false,
          error: `XGate error: ${errorMessage}`,
          code: errorCode
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error creating USDT order:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno ao criar ordem USDT',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}