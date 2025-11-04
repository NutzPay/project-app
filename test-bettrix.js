const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

async function testBettrix() {
  try {
    console.log('🔄 Testing Bettrix API...');

    const response = await fetch('https://cashin.safepayments.cloud/transaction/qrcode/cashin', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BETTRIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payerName: 'Teste Cliente',
        payerDocument: '12345678900',
        payerEmail: 'teste@teste.com',
        payerPhone: '11999999999',
        productName: 'Depósito PIX',
        productDescription: 'Teste de integração',
        value: 1000,
        externalId: 'test-' + Date.now(),
        orderId: 'test-' + Date.now()
      })
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('📊 Headers:', Object.fromEntries(response.headers));

    const text = await response.text();
    console.log('\n📄 Raw Response:');
    console.log(text.substring(0, 1000));

    try {
      const json = JSON.parse(text);
      console.log('\n✅ JSON Response:');
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('\n❌ Response is not JSON');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBettrix();
