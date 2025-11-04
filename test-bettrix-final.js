const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

async function testBettrix() {
  try {
    console.log('🔄 Testing Bettrix API with CORRECT fields from documentation...\n');

    const testId = 'nutz-test-' + Date.now();
    
    // Payload seguindo EXATAMENTE a documentação oficial
    const payload = {
      payerName: 'Teste Cliente',
      payerDocument: '12345678900',
      payerEmail: 'teste@nutzpay.com',
      payerPhone: '11999999999',
      productName: 'Depósito PIX',
      productDescription: 'Teste de integração NutzPay',
      value: 1000, // R$ 10,00 em centavos
      orderId: testId,
      postbackUrl: 'https://betsolve.ngrok.dev/api/bettrix/webhook'
    };

    console.log('📤 Sending payload (per official docs):');
    console.log(JSON.stringify(payload, null, 2));
    console.log();

    const response = await fetch('https://cashin.safepayments.cloud/transaction/qrcode/cashin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BETTRIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Status:', response.status, response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers));
    console.log();

    const text = await response.text();
    
    if (response.ok) {
      const json = JSON.parse(text);
      console.log('✅ SUCCESS! QR Code Created:');
      console.log(JSON.stringify(json, null, 2));
      console.log('\n🎉 Transaction ID:', json.transactionId);
      console.log('🎉 Order ID:', json.orderId);
      if (json.qrCode) {
        console.log('🎉 QR Code URL:', json.qrCode.substring(0, 100) + '...');
      }
    } else {
      console.log('❌ Error Response:');
      console.log(text);
      try {
        const json = JSON.parse(text);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {}
    }

  } catch (error) {
    console.error('\n❌ Exception:', error.message);
    console.error(error.stack);
  }
}

testBettrix();
