import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to verify CoinMarketCap integration
export async function GET(request: NextRequest) {
  try {
    // Test the internal API endpoint
    const baseUrl = request.nextUrl.origin;
    const testResponse = await fetch(`${baseUrl}/api/crypto/coinmarketcap?convert=BRL`, {
      method: 'GET',
    });

    if (!testResponse.ok) {
      throw new Error(`API test failed with status: ${testResponse.status}`);
    }

    const testData = await testResponse.json();

    return NextResponse.json({
      success: true,
      message: 'CoinMarketCap API integration working correctly',
      timestamp: new Date().toISOString(),
      testData: testData,
      status: {
        api_connection: 'OK',
        data_format: testData.success ? 'OK' : 'ERROR',
        real_time_data: testData.success && testData.data?.currentPrice ? 'OK' : 'ERROR'
      }
    });

  } catch (error) {
    console.error('API test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'CoinMarketCap API integration test failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      status: {
        api_connection: 'ERROR',
        data_format: 'ERROR',
        real_time_data: 'ERROR'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testHistorical = false } = await request.json();
    const baseUrl = request.nextUrl.origin;

    const tests = [];

    // Test current price endpoint
    try {
      const currentResponse = await fetch(`${baseUrl}/api/crypto/coinmarketcap?convert=BRL`);
      const currentData = await currentResponse.json();
      tests.push({
        test: 'Current Price (BRL)',
        success: currentResponse.ok && currentData.success,
        data: currentData.success ? {
          price: currentData.data.currentPrice,
          change: currentData.data.changePercent24h,
          lastUpdate: currentData.data.lastUpdate
        } : null,
        error: !currentData.success ? currentData.message : null
      });
    } catch (err) {
      tests.push({
        test: 'Current Price (BRL)',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test USD endpoint
    try {
      const usdResponse = await fetch(`${baseUrl}/api/crypto/coinmarketcap?convert=USD`);
      const usdData = await usdResponse.json();
      tests.push({
        test: 'Current Price (USD)',
        success: usdResponse.ok && usdData.success,
        data: usdData.success ? {
          price: usdData.data.currentPrice,
          change: usdData.data.changePercent24h
        } : null,
        error: !usdData.success ? usdData.message : null
      });
    } catch (err) {
      tests.push({
        test: 'Current Price (USD)',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    // Test historical data if requested
    if (testHistorical) {
      try {
        const historicalResponse = await fetch(`${baseUrl}/api/crypto/coinmarketcap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ convert: 'BRL', days: 30 })
        });
        const historicalData = await historicalResponse.json();
        tests.push({
          test: 'Historical Data (30 days)',
          success: historicalResponse.ok && historicalData.success,
          data: historicalData.success ? {
            dataPoints: historicalData.data?.length || 0,
            firstDate: historicalData.data?.[0]?.date,
            lastDate: historicalData.data?.[historicalData.data.length - 1]?.date
          } : null,
          error: !historicalData.success ? historicalData.message : null
        });
      } catch (err) {
        tests.push({
          test: 'Historical Data (30 days)',
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    const allPassed = tests.every(test => test.success);

    return NextResponse.json({
      success: allPassed,
      message: allPassed ? 'All tests passed' : 'Some tests failed',
      timestamp: new Date().toISOString(),
      testResults: tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length
      }
    });

  } catch (error) {
    console.error('API comprehensive test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Test execution failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}