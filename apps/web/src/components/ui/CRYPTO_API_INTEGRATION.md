# Integração com APIs de Criptomoedas

Este documento explica como integrar APIs reais de cotação de criptomoedas no componente USDTQuote.

## APIs Suportadas

### 1. CoinGecko API (Recomendada)
- **Gratuita**: Até 30 chamadas/minuto
- **Fácil de usar**: Não requer API key para uso básico
- **Dados confiáveis**: Uma das maiores fontes de dados crypto

```typescript
// Exemplo de implementação no hook useCryptoPrice.ts
const priceResponse = await fetch(
  `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
);

// Para dados históricos
const historicalResponse = await fetch(
  `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=${vsCurrency}&days=365&interval=monthly`
);
```

### 2. CoinMarketCap API
- **Mais precisa**: Dados de maior qualidade
- **Requer API Key**: Plano gratuito limitado
- **Rate limits**: 333 calls/day no plano gratuito

```typescript
// Criar endpoint API em /pages/api/crypto/price.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { coin, vsCurrency } = req.body;
  
  const response = await fetch(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
    {
      headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
      }
    }
  );
}
```

## Configuração de Produção

### 1. Variáveis de Ambiente

```env
# .env.local
COINMARKETCAP_API_KEY=your_api_key_here
COINGECKO_PRO_API_KEY=your_api_key_here # Se usar plano pro
CRYPTO_UPDATE_INTERVAL=300000 # 5 minutos
```

### 2. Configuração no Hook

Para ativar APIs reais, edite o arquivo `hooks/useCryptoPrice.ts`:

```typescript
// Substitua a seção "Mock data" por:
const fetchCryptoData = useCallback(async () => {
  try {
    setError(null);
    
    // Opção 1: CoinGecko (descomente as linhas abaixo)
    const priceResponse = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    );
    
    if (!priceResponse.ok) {
      throw new Error('Falha ao buscar dados de preço');
    }
    
    const priceData = await priceResponse.json();
    const coinData = priceData[coin];
    
    const cryptoData: CryptoPriceData = {
      currentPrice: coinData[vsCurrency],
      change24h: coinData[`${vsCurrency}_24h_change`] || 0,
      changePercent24h: coinData[`${vsCurrency}_24h_change`] || 0,
      lastUpdate: new Date().toLocaleString('pt-BR'),
      volume24h: coinData[`${vsCurrency}_24h_vol`],
      marketCap: coinData[`${vsCurrency}_market_cap`]
    };
    
    setData(cryptoData);

    // Fetch historical data
    if (enableHistorical) {
      const historicalResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=${vsCurrency}&days=365&interval=monthly`
      );
      
      if (historicalResponse.ok) {
        const historical = await historicalResponse.json();
        const formattedHistorical = historical.prices.map((price: [number, number]) => ({
          date: new Date(price[0]).toISOString().split('T')[0],
          price: price[1],
          month: new Date(price[0]).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        }));
        setHistoricalData(formattedHistorical);
      }
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    setError(errorMessage);
    
    // Fallback para dados mock em caso de erro
    setData(generateMockData());
    if (enableHistorical) {
      setHistoricalData(generateMockHistoricalData());
    }
  } finally {
    setLoading(false);
  }
}, [coin, vsCurrency, enableHistorical, generateMockData, generateMockHistoricalData]);
```

## Rate Limiting e Cache

### 1. Implementar Cache no Lado do Servidor

```typescript
// pages/api/crypto/price.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cacheKey = `${coin}_${vsCurrency}`;
  const cached = cache.get(cacheKey);
  
  if (cached) {
    return res.status(200).json(cached);
  }
  
  // Fazer chamada à API...
  const data = await fetchFromAPI();
  
  cache.set(cacheKey, data);
  return res.status(200).json(data);
}
```

### 2. Configurar Limites de Taxa

```typescript
// Adicione throttling no hook
const lastFetchTime = useRef(0);
const MIN_INTERVAL = 60000; // 1 minuto mínimo entre chamadas

const fetchWithThrottle = useCallback(async () => {
  const now = Date.now();
  if (now - lastFetchTime.current < MIN_INTERVAL) {
    console.log('Request throttled');
    return;
  }
  
  lastFetchTime.current = now;
  await fetchCryptoData();
}, [fetchCryptoData]);
```

## Tratamento de Erros

### 1. Estados de Erro

```typescript
// No componente USDTQuote.tsx
{error && (
  <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
    <div className="flex items-center space-x-2">
      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-red-700 text-sm">
        Erro ao carregar cotação. Mostrando dados simulados.
      </span>
    </div>
  </div>
)}
```

### 2. Retry Logic

```typescript
const fetchWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetchCryptoData();
      break;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

## Monitoramento e Logs

### 1. Log de Performance

```typescript
console.log(`[CryptoAPI] Fetched ${coin} price in ${Date.now() - startTime}ms`);
```

### 2. Metrics (Opcional)

```typescript
// Implementar métricas para monitorar uso da API
const trackAPIUsage = (endpoint: string, success: boolean) => {
  // Enviar para analytics
  gtag('event', 'crypto_api_call', {
    endpoint,
    success,
    timestamp: Date.now()
  });
};
```

## Segurança

### 1. Nunca Expor API Keys no Frontend

```typescript
// ❌ NUNCA faça isso
const API_KEY = 'your_secret_key';

// ✅ Use endpoints do servidor
const data = await fetch('/api/crypto/price', {
  method: 'POST',
  body: JSON.stringify({ coin, vsCurrency })
});
```

### 2. Validação de Entrada

```typescript
const isValidCoin = (coin: string): boolean => {
  const allowedCoins = ['bitcoin', 'ethereum', 'tether', 'binancecoin'];
  return allowedCoins.includes(coin.toLowerCase());
};
```

## Deployment Checklist

- [ ] Configurar variáveis de ambiente de produção
- [ ] Testar rate limits com volume real
- [ ] Implementar monitoramento de APIs
- [ ] Configurar alertas para falhas
- [ ] Testar fallback para dados mock
- [ ] Documentar custos da API

## APIs Alternativas

1. **Binance API**: Boa para dados em tempo real
2. **Coinbase Pro API**: Dados confiáveis
3. **CryptoCompare**: Boa cobertura histórica
4. **Messari API**: Dados fundamentais

## Suporte

Para questões sobre implementação:
1. Consulte a documentação da API escolhida
2. Teste primeiro no ambiente de desenvolvimento
3. Implemente logs detalhados para debug