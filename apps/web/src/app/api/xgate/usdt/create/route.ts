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

      // NOVA ESTRATÉGIA: Usar USDT amount como base e calcular BRL necessário via XGate
      console.log('💱 Getting XGate quote to calculate exact BRL amount needed...');

      // Primeiro tentar obter cotação real do XGate para o amount de USDT desejado
      let finalBrlAmount = amount;
      let finalUsdtAmount = usdtAmount;
      let usingXGateQuote = false;

      // Tentar diferentes estratégias para obter a cotação correta do XGate
      try {
        // Estratégia 1: Usar quote reverso (informar USDT desejado)
        console.log(`🎯 Trying to get exact BRL cost for ${usdtAmount} USDT from XGate...`);

        // Como o XGate pode não ter endpoint reverso, vamos fazer aproximação iterativa
        // Por enquanto, usar nossa cotação como base e depois ajustar no webhook
        const priceCalculation = await priceCalculator.calculatePrice(usdtAmount, currentUser.id);
        finalBrlAmount = priceCalculation.finalPrice;

        console.log('📊 Calculated BRL amount needed:', {
          requestedUSDT: usdtAmount,
          calculatedBRL: finalBrlAmount,
          usdtPrice: priceCalculation.usdtPrice,
          sellerFee: priceCalculation.sellerFee
        });

        // Testar com uma quote do XGate para ver se a proporção está correta
        const testQuote = await xgateService.getQuote(finalBrlAmount);
        if (testQuote.success && testQuote.data) {
          console.log('✅ XGate test quote:', {
            inputBRL: finalBrlAmount,
            outputUSDT: testQuote.data.toAmount,
            difference: Math.abs(testQuote.data.toAmount - usdtAmount)
          });

          // Se a diferença for muito grande (>1%), ajustar
          if (Math.abs(testQuote.data.toAmount - usdtAmount) > (usdtAmount * 0.01)) {
            console.log('🔧 Adjusting BRL amount based on XGate quote...');
            const adjustmentFactor = usdtAmount / testQuote.data.toAmount;
            finalBrlAmount = finalBrlAmount * adjustmentFactor;
            finalUsdtAmount = usdtAmount; // Manter exato
            usingXGateQuote = true;

            console.log('✅ Adjusted amounts:', {
              adjustedBRL: finalBrlAmount,
              targetUSDT: finalUsdtAmount,
              adjustmentFactor
            });
          }
        }

      } catch (quoteError) {
        console.log('⚠️ Could not get XGate quote, using fallback calculation');
        const priceCalculation = await priceCalculator.calculatePrice(usdtAmount, currentUser.id);
        finalBrlAmount = priceCalculation.finalPrice;
      }

      console.log('💰 Final amounts for XGate deposit:', {
        brlAmount: finalBrlAmount,
        usdtTarget: finalUsdtAmount,
        usingXGateQuote
      });

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

      // Create deposit order com valores ajustados
      console.log('💳 Creating deposit order...');
      const depositResult = await xgateService.createDeposit({
        customerId: customerId,
        currencyId: brlCurrency._id,
        cryptoId: usdtCrypto._id,
        amount: finalBrlAmount, // Usar valor BRL ajustado
        description: description,
        webhookUrl: process.env.XGATE_WEBHOOK_URL || 'https://b8c28d1f0f95.ngrok.app/api/xgate/webhook'
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
          amount: finalUsdtAmount, // Usar valor USDT exato solicitado
          pixCode: depositResult.data.pixCode,
          pixTransactionId: depositResult.data.id,
          brlAmount: finalBrlAmount, // Usar valor BRL ajustado
          exchangeRate: finalBrlAmount / finalUsdtAmount, // Taxa real usada
          description: description,
          externalId: depositResult.data.id
        });

        console.log('✅ Pending transaction created in database:', {
          userId: currentUser.id,
          userEmail: currentUser.email,
          pixTransactionId: depositResult.data.id,
          usdtAmount: finalUsdtAmount
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
        exchangeRate: finalBrlAmount / finalUsdtAmount,
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