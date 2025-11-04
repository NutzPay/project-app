const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

async function testBettrix() {
  try {
    console.log('🔄 Testing with BOTH orderId AND externalId...\n');

    const testId = 'nutz-' + Date.now();
    
    const payload = {
      payerName: 'Teste Cliente',
      payerDocument: '12345678900',
      payerEmail: 'teste@nutzpay.com',
      payerPhone: '11999999999',
      productName: 'Depósito PIX',
      productDescription: 'Teste de integração',
      value: 1000,
      orderId: testId,
      externalId: testId, // Tentando com ambos
      postbackUrl: 'https://betsolve.ngrok.dev/api/bettrix/webhook'
    };

    console.log('📤 Payload:');
    console.log(JSON.stringify(payload, null, 2));

    const response = await fetch('https://cashin.safepayments.cloud/transaction/qrcode/cashin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BETTRIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Status:', response.status);
    const text = await response.text();
    
    if (response.ok) {
      const json = JSON.parse(text);
      console.log('\n✅ SUCCESS!');
      console.log(JSON.stringify(json, null, 2));
    } else {
      console.log('\n❌ Error:', text);
    }

  } catch (error) {
    console.error('\n❌ Exception:', error.message);
  }
}

testBettrix();
