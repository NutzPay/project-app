const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

async function testBettrix() {
  try {
    console.log('🔄 Testing Bettrix API with ExternalId (PascalCase)...');

    const testId = 'test-' + Date.now();
    const payload = {
      PayerName: 'Teste Cliente',
      PayerDocument: '12345678900',
      PayerEmail: 'teste@teste.com',
      PayerPhone: '11999999999',
      ProductName: 'Depósito PIX',
      ProductDescription: 'Teste de integração',
      Value: 1000,
      ExternalId: testId,
      OrderId: testId
    };

    console.log('\n📤 Sending payload:');
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
    console.log('📊 Status Text:', response.statusText);

    const text = await response.text();
    console.log('\n📄 Raw Response:');
    console.log(text.substring(0, 2000));

    try {
      const json = JSON.parse(text);
      console.log('\n✅ JSON Response:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('\n❌ Response is not JSON');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testBettrix();
