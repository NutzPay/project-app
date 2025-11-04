const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

async function testBalance() {
  try {
    console.log('🔄 Testing Bettrix Balance endpoint (authentication test)...\n');

    const response = await fetch('https://cashin.safepayments.cloud/transaction/get/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BETTRIX_API_KEY}`,
      }
    });

    console.log('📊 Status:', response.status, response.statusText);
    const text = await response.text();
    
    if (response.ok) {
      const json = JSON.parse(text);
      console.log('\n✅ Authentication WORKING! Balance:');
      console.log(JSON.stringify(json, null, 2));
      console.log('\nSaldo disponível: R$', (json.finalBalance / 100).toFixed(2));
    } else {
      console.log('\n❌ Authentication FAILED or No Permission:');
      console.log(text);
    }

  } catch (error) {
    console.error('\n❌ Exception:', error.message);
  }
}

testBalance();
