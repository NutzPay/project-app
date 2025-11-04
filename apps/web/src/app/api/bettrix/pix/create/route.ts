import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';
const BETTRIX_URL = 'https://cashin.safepayments.cloud/transaction/qrcode/cashin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [PIX CREATE] ========================================');
    console.log('🔵 [PIX CREATE] Nova requisição recebida');
    console.log('🔵 [PIX CREATE] Timestamp:', new Date().toISOString());
    console.log('🔵 [PIX CREATE] URL:', request.url);
    console.log('🔵 [PIX CREATE] Method:', request.method);
    console.log('🔵 [PIX CREATE] Headers:', Object.fromEntries(request.headers));

    // Parse body
    const rawBody = await request.text();
    console.log('📦 [PIX CREATE] Raw body recebido:', rawBody);

    const body = JSON.parse(rawBody);
    const { amount, name, taxId, description } = body;

    console.log('📋 [PIX CREATE] Body parseado:', body);
    console.log('📋 [PIX CREATE] Amount:', amount, '(tipo:', typeof amount, ')');
    console.log('📋 [PIX CREATE] Name:', name, '(tipo:', typeof name, ')');
    console.log('📋 [PIX CREATE] TaxId:', taxId, '(tipo:', typeof taxId, ')');
    console.log('📋 [PIX CREATE] Description:', description);

    // Validação básica
    console.log('✅ [PIX CREATE] Iniciando validação...');
    if (!amount || !name || !taxId) {
      console.log('❌ [PIX CREATE] Validação falhou!');
      console.log('❌ [PIX CREATE] amount:', !!amount);
      console.log('❌ [PIX CREATE] name:', !!name);
      console.log('❌ [PIX CREATE] taxId:', !!taxId);
      return NextResponse.json({
        success: false,
        error: 'Campos obrigatórios faltando'
      }, { status: 400 });
    }
    console.log('✅ [PIX CREATE] Validação passou!');

    // Autenticar usuário
    console.log('🔐 [PIX CREATE] Verificando sessão do usuário...');
    const user = await getCurrentUser(request);
    if (!user || !user.id) {
      console.log('❌ [PIX CREATE] Usuário não autenticado!');
      return NextResponse.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }
    console.log('✅ [PIX CREATE] Usuário autenticado:', user.id, user.email);

    // Criar ou buscar PIXWallet do usuário
    console.log('💼 [PIX CREATE] Verificando PIXWallet...');
    let pixWallet = await prisma.pIXWallet.findUnique({
      where: { userId: user.id }
    });

    if (!pixWallet) {
      console.log('💼 [PIX CREATE] Criando novo PIXWallet para usuário...');
      pixWallet = await prisma.pIXWallet.create({
        data: {
          userId: user.id,
          balance: 0,
          totalDeposited: 0,
          totalWithdrawn: 0
        }
      });
      console.log('✅ [PIX CREATE] PIXWallet criado:', pixWallet.id);
    } else {
      console.log('✅ [PIX CREATE] PIXWallet encontrado:', pixWallet.id);
    }

    // Gerar orderId único
    const orderId = `nutz-pix-${Date.now()}`;
    console.log('🆔 [PIX CREATE] OrderId gerado:', orderId);

    // Limpar documento
    const cleanDocument = taxId.replace(/\D/g, '');
    console.log('🧹 [PIX CREATE] Documento original:', taxId);
    console.log('🧹 [PIX CREATE] Documento limpo:', cleanDocument);

    // Calcular valor em centavos
    const valueInCents = Math.round(amount * 100);
    console.log('💰 [PIX CREATE] Valor em BRL:', amount);
    console.log('💰 [PIX CREATE] Valor em centavos:', valueInCents);

    // Montar payload EXATAMENTE como funciona no curl
    const bettrixPayload = {
      ExternalId: orderId,  // PascalCase!
      payerName: name,
      payerDocument: cleanDocument,
      payerEmail: 'pagamento@nutzpay.com',
      payerPhone: '11999999999',
      productName: 'Depósito PIX',
      productDescription: description || 'Depósito via PIX',
      value: valueInCents,
      orderId: orderId,
      postbackUrl: 'https://nutzpay.com/api/bettrix/webhook/cashin'
    };

    console.log('📦 [PIX CREATE] Payload construído:');
    console.log('📦 [PIX CREATE] ', JSON.stringify(bettrixPayload, null, 2));
    console.log('📤 [PIX CREATE] Verificando cada campo:');
    console.log('📤 [PIX CREATE]   - ExternalId:', bettrixPayload.ExternalId, '(tipo:', typeof bettrixPayload.ExternalId, ')');
    console.log('📤 [PIX CREATE]   - payerName:', bettrixPayload.payerName);
    console.log('📤 [PIX CREATE]   - payerDocument:', bettrixPayload.payerDocument);
    console.log('📤 [PIX CREATE]   - value:', bettrixPayload.value);
    console.log('📤 [PIX CREATE]   - orderId:', bettrixPayload.orderId);

    // Fazer requisição para Bettrix
    console.log('🌐 [PIX CREATE] Iniciando requisição para Bettrix...');
    console.log('🌐 [PIX CREATE] URL:', BETTRIX_URL);
    console.log('🌐 [PIX CREATE] Authorization: Bearer', BETTRIX_API_KEY.substring(0, 20) + '...');

    const bodyString = JSON.stringify(bettrixPayload);
    console.log('🌐 [PIX CREATE] Body stringificado (length:', bodyString.length, '):', bodyString);
    console.log('🌐 [PIX CREATE] Body COMPLETO:', bodyString);

    const headers = {
      'Authorization': `Bearer ${BETTRIX_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'NutzPay/1.0'
    };

    console.log('🌐 [PIX CREATE] Headers da requisição:', headers);

    const bettrixResponse = await fetch(BETTRIX_URL, {
      method: 'POST',
      headers: headers,
      body: bodyString,
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    }).catch(err => {
      console.log('❌ [PIX CREATE] Fetch exception:', err);
      console.log('❌ [PIX CREATE] Error code:', err.code);
      console.log('❌ [PIX CREATE] Error cause:', err.cause);
      throw err;
    });

    console.log('📊 [PIX CREATE] ========== RESPOSTA BETTRIX ==========');
    console.log('📊 [PIX CREATE] Status:', bettrixResponse.status, bettrixResponse.statusText);
    console.log('📊 [PIX CREATE] OK?:', bettrixResponse.ok);
    console.log('📊 [PIX CREATE] Headers:', Object.fromEntries(bettrixResponse.headers));

    const responseText = await bettrixResponse.text();
    console.log('📥 [PIX CREATE] Response body (length:', responseText.length, ')');
    console.log('📥 [PIX CREATE] Response text:', responseText.substring(0, 1000));

    if (!bettrixResponse.ok) {
      console.log('❌ [PIX CREATE] Bettrix retornou erro!');
      console.log('❌ [PIX CREATE] Status:', bettrixResponse.status);
      console.log('❌ [PIX CREATE] Response completa:', responseText);
      throw new Error(`Bettrix erro ${bettrixResponse.status}: ${responseText}`);
    }

    // Parse resposta
    console.log('🔄 [PIX CREATE] Parseando resposta JSON...');
    const bettrixData = JSON.parse(responseText);
    console.log('✅ [PIX CREATE] JSON parseado:', bettrixData);
    console.log('✅ [PIX CREATE] Transaction ID:', bettrixData.transactionId);

    // Salvar transação no banco de dados
    console.log('💾 [PIX CREATE] Salvando transação no banco de dados...');
    const pixTransaction = await prisma.pIXTransaction.create({
      data: {
        walletId: pixWallet.id,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount: amount,
        pixCode: bettrixData.qrCode,
        externalId: orderId,
        description: description || `Depósito PIX de R$ ${amount}`,
        metadata: JSON.stringify({
          bettrixTransactionId: bettrixData.transactionId.toString(),
          txId: bettrixData.txId,
          externalId: bettrixData.externalId,
          qrCodeBase64: bettrixData.qrCodeBase64,
          payerName: name,
          payerDocument: cleanDocument
        })
      }
    });
    console.log('✅ [PIX CREATE] Transação salva no banco:', pixTransaction.id);

    // Montar resposta para o frontend
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(bettrixData.qrCode)}`;
    console.log('🎨 [PIX CREATE] QR Code URL gerada (length:', qrCodeUrl.length, ')');

    const response = {
      success: true,
      transactionId: bettrixData.transactionId.toString(),
      orderId: orderId,
      pixTransactionId: pixTransaction.id, // ID da transação no nosso banco
      qrCodeUrl: qrCodeUrl,
      qrCodeText: bettrixData.qrCode,
      qrCodeBase64: bettrixData.qrCodeBase64,
      amount: amount,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    console.log('📤 [PIX CREATE] Resposta final para frontend:');
    console.log('📤 [PIX CREATE] ', JSON.stringify(response, null, 2));
    console.log('✅ [PIX CREATE] ========================================');
    console.log('✅ [PIX CREATE] SUCESSO! Transaction ID:', bettrixData.transactionId);
    console.log('✅ [PIX CREATE] PIX Transaction ID:', pixTransaction.id);
    console.log('✅ [PIX CREATE] ========================================');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [PIX CREATE] ========================================');
    console.error('❌ [PIX CREATE] ERRO CAPTURADO!');
    console.error('❌ [PIX CREATE] Tipo:', error?.constructor?.name);
    console.error('❌ [PIX CREATE] Mensagem:', error instanceof Error ? error.message : String(error));
    console.error('❌ [PIX CREATE] Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ [PIX CREATE] ========================================');

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao gerar PIX'
    }, { status: 500 });
  }
}
