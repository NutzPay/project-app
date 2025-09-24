import { NextRequest, NextResponse } from 'next/server';

const COINMARKETCAP_API_KEY = 'c869de7b-42c5-4de2-b19c-c837458b493f';
const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com';

interface CoinMarketCapQuote {
  price: number;
  volume_24h: number;
  percent_change_24h: number;
  market_cap: number;
  last_updated: string;
}

interface CoinMarketCapResponse {
  data: {
    USDT: [{
      quote: {
        USD: CoinMarketCapQuote;
        BRL: CoinMarketCapQuote;
      };
    }];
    BTC: [{
      quote: {
        USD: CoinMarketCapQuote;
        BRL: CoinMarketCapQuote;
      };
    }];
    ETH: [{
      quote: {
        USD: CoinMarketCapQuote;
        BRL: CoinMarketCapQuote;
      };
    }];
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const convert = searchParams.get('convert') || 'BRL';

  try {
    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/v2/cryptocurrency/quotes/latest?symbol=USDT,BTC,ETH&convert=${convert}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data: CoinMarketCapResponse = await response.json();
    const usdtData = data.data.USDT[0];
    const btcData = data.data.BTC[0];
    const ethData = data.data.ETH[0];
    
    const usdtQuote = convert === 'USD' ? usdtData.quote.USD : usdtData.quote.BRL;
    const btcQuote = convert === 'USD' ? btcData.quote.USD : btcData.quote.BRL;
    const ethQuote = convert === 'USD' ? ethData.quote.USD : ethData.quote.BRL;

    const formattedData = {
      USDT: {
        symbol: 'USDT',
        name: 'Tether USD',
        currentPrice: usdtQuote.price,
        change24h: usdtQuote.percent_change_24h,
        volume24h: usdtQuote.volume_24h,
        marketCap: usdtQuote.market_cap,
        lastUpdate: new Date(usdtQuote.last_updated).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      BTC: {
        symbol: 'BTC',
        name: 'Bitcoin',
        currentPrice: btcQuote.price,
        change24h: btcQuote.percent_change_24h,
        volume24h: btcQuote.volume_24h,
        marketCap: btcQuote.market_cap,
        lastUpdate: new Date(btcQuote.last_updated).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
      ETH: {
        symbol: 'ETH',
        name: 'Ethereum',
        currentPrice: ethQuote.price,
        change24h: ethQuote.percent_change_24h,
        volume24h: ethQuote.volume_24h,
        marketCap: ethQuote.market_cap,
        lastUpdate: new Date(ethQuote.last_updated).toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    };

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('Error fetching USDT data from CoinMarketCap:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch USDT data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { convert = 'BRL', days = 30 } = await request.json();
    
    // Para dados históricos, usamos um período específico
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await fetch(
      `${COINMARKETCAP_BASE_URL}/v2/cryptocurrency/quotes/historical?symbol=USDT&time_start=${startDate}&time_end=${endDate}&interval=daily&convert=${convert}`,
      {
        headers: {
          'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status}`);
    }

    const data = await response.json();
    const historicalData = data.data.quotes.map((quote: any) => ({
      date: quote.timestamp.split('T')[0],
      price: quote.quote[convert].price,
      month: new Date(quote.timestamp).toLocaleDateString('pt-BR', { 
        month: 'short', 
        year: 'numeric' 
      })
    }));

    return NextResponse.json({
      success: true,
      data: historicalData
    });

  } catch (error) {
    console.error('Error fetching historical USDT data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch historical data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}