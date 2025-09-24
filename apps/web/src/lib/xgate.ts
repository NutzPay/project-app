interface XGateAuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

interface XGateCurrency {
  _id: string;
  id?: string;
  name: string;
  symbol: string;
  type: string;
}

interface XGateCrypto {
  _id: string;
  id?: string;
  name: string;
  symbol: string;
  network?: string;
  coinGecko?: string;
}

interface XGateCustomer {
  id: string;
  name: string;
  email: string;
  document: string;
}

interface XGateQuoteResponse {
  success: boolean;
  data?: {
    fromAmount: number;
    toAmount: number;
    rate: number;
    expires: string;
  };
  error?: string;
}

interface XGateDepositResponse {
  success: boolean;
  data?: {
    id: string;
    pixCode: string;
    status: string;
    amount: number;
    cryptoAmount: number;
    expiresAt: string;
    qrCodeUrl?: string;
  };
  error?: string;
}

interface XGateDepositRequest {
  customerId: string;
  currencyId: string;
  cryptoId: string;
  amount: number;
  description: string;
  webhookUrl: string;
}

class XGateService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private currencies: XGateCurrency[] = [];
  private cryptos: XGateCrypto[] = [];
  
  private readonly apiUrl: string;
  private readonly email: string;
  private readonly password: string;
  private readonly webhookUrl: string;

  constructor() {
    // Hardcoded for testing - REPLACE IN PRODUCTION
    this.apiUrl = 'https://api.xgateglobal.com';
    this.email = 'felix@elmada.bet';
    this.password = '5D7BSrwDBqoHJIPHD1oLg4w5t8';
    this.webhookUrl = process.env.XGATE_WEBHOOK_URL || 'https://b8c28d1f0f95.ngrok.app/api/xgate/webhook';
    
    console.log('🔧 XGate environment check:', {
      apiUrl: this.apiUrl ? '✅ Set' : '❌ Missing',
      email: this.email ? '✅ Set' : '❌ Missing',
      password: this.password ? '✅ Set' : '❌ Missing',
      webhookUrl: this.webhookUrl ? '✅ Set' : '❌ Missing'
    });
    
    if (!this.apiUrl || !this.email || !this.password) {
      console.error('❌ XGate credentials missing:', {
        XGATE_API_URL: process.env.XGATE_API_URL,
        XGATE_EMAIL: process.env.XGATE_EMAIL ? 'EXISTS' : 'MISSING',
        XGATE_PASSWORD: process.env.XGATE_PASSWORD ? 'EXISTS' : 'MISSING',
        XGATE_WEBHOOK_URL: process.env.XGATE_WEBHOOK_URL
      });
      throw new Error('XGate credentials not configured');
    }
  }

  private async makeRequest(
    endpoint: string, 
    method: 'GET' | 'POST' = 'GET', 
    data?: any,
    requireAuth: boolean = true
  ): Promise<any> {
    try {
      if (requireAuth && !(await this.ensureAuthenticated())) {
        throw new Error('Authentication failed');
      }

      const url = `${this.apiUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (requireAuth && this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      console.log(`🌐 XGate ${method} ${endpoint}`);
      
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ XGate API error [${response.status}]:`, responseData);
        
        // Handle 401 Unauthorized - token expired
        if (response.status === 401 && requireAuth) {
          console.log('🔄 Token expired, re-authenticating...');
          this.token = null;
          this.tokenExpiry = null;
          
          if (await this.ensureAuthenticated()) {
            // Retry request with new token
            headers['Authorization'] = `Bearer ${this.token}`;
            const retryResponse = await fetch(url, {
              method,
              headers,
              body: data ? JSON.stringify(data) : undefined,
            });
            return await retryResponse.json();
          }
        }
        
        throw new Error(`XGate API error: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      console.log('✅ XGate API response:', responseData);
      return responseData;

    } catch (error) {
      console.error('❌ XGate request failed:', error);
      throw error;
    }
  }

  private async authenticate(): Promise<XGateAuthResponse> {
    try {
      console.log('🔐 Authenticating with XGate...');
      
      const response = await this.makeRequest('/auth/token', 'POST', {
        email: this.email,
        password: this.password
      }, false);

      if (response.token) {
        this.token = response.token;
        // Set token expiry to 23 hours from now (assuming 24h validity)
        this.tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
        
        console.log('✅ XGate authentication successful');
        return { success: true, token: response.token };
      } else {
        console.error('❌ XGate authentication failed - no token received');
        return { success: false, error: 'No token received' };
      }
    } catch (error) {
      console.error('❌ XGate authentication error:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  private async ensureAuthenticated(): Promise<boolean> {
    // Check if token exists and is still valid
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return true;
    }

    // Authenticate
    const authResult = await this.authenticate();
    return authResult.success;
  }

  async loadCurrenciesAndCryptos(): Promise<boolean> {
    try {
      console.log('📋 Loading XGate currencies and cryptos...');
      
      // Load currencies (BRL/PIX)
      const currenciesResponse = await this.makeRequest('/deposit/company/currencies');
      if (currenciesResponse && Array.isArray(currenciesResponse)) {
        this.currencies = currenciesResponse;
        console.log('✅ Loaded currencies:', this.currencies.map(c => c.symbol));
      }

      // Load cryptocurrencies (USDT)
      const cryptosResponse = await this.makeRequest('/deposit/company/cryptocurrencies');
      if (cryptosResponse && Array.isArray(cryptosResponse)) {
        this.cryptos = cryptosResponse;
        console.log('✅ Loaded cryptos:', this.cryptos.map(c => c.symbol));
      }

      return this.currencies.length > 0 && this.cryptos.length > 0;
    } catch (error) {
      console.error('❌ Failed to load currencies/cryptos:', error);
      return false;
    }
  }

  getBRLCurrency(): XGateCurrency | null {
    return this.currencies.find(c => c.symbol === 'BRL' || c.type === 'PIX') || null;
  }

  getUSDTCrypto(): XGateCrypto | null {
    return this.cryptos.find(c => c.symbol === 'USDT') || null;
  }

  async getQuote(fromAmount: number): Promise<XGateQuoteResponse> {
    try {
      console.log(`💱 Getting USDT quote for ${fromAmount} BRL`);
      
      // Try the main conversion endpoint first
      try {
        const response = await this.makeRequest('/deposit/conversion/tether', 'POST', {
          amount: fromAmount,
          currency: 'BRL'
        });

        if (response && (response.toAmount || response.conversion)) {
          const toAmount = response.toAmount || response.conversion?.amount || 0;
          const rate = response.rate || response.conversion?.rate || (toAmount / fromAmount);
          
          return {
            success: true,
            data: {
              fromAmount: fromAmount,
              toAmount: toAmount,
              rate: rate,
              expires: response.expires || new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }
          };
        }
      } catch (conversionError) {
        console.warn('⚠️ Primary conversion endpoint failed, trying alternatives...');
        
        // Try alternative endpoints or approaches
        try {
          // Try with currency IDs instead
          const brlCurrency = this.getBRLCurrency();
          const usdtCrypto = this.getUSDTCrypto();
          
          if (brlCurrency && usdtCrypto) {
            const altResponse = await this.makeRequest('/deposit/conversion', 'POST', {
              amount: fromAmount,
              currency_id: brlCurrency._id || brlCurrency.id,
              cryptocurrency_id: usdtCrypto._id || usdtCrypto.id
            });
            
            if (altResponse && (altResponse.toAmount || altResponse.conversion)) {
              const toAmount = altResponse.toAmount || altResponse.conversion?.amount || 0;
              const rate = altResponse.rate || altResponse.conversion?.rate || (toAmount / fromAmount);
              
              return {
                success: true,
                data: {
                  fromAmount: fromAmount,
                  toAmount: toAmount,
                  rate: rate,
                  expires: altResponse.expires || new Date(Date.now() + 15 * 60 * 1000).toISOString()
                }
              };
            }
          }
        } catch (altError) {
          console.warn('⚠️ Alternative conversion endpoint also failed:', altError);
        }
        
        // Re-throw original error
        throw conversionError;
      }
      
      return { success: false, error: 'Invalid quote response' };
    } catch (error) {
      console.error('❌ Quote request failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async createOrGetCustomer(name: string, email: string, document: string): Promise<string | null> {
    try {
      console.log(`👤 Creating/getting customer: ${email}`);
      
      const response = await this.makeRequest('/customer', 'POST', {
        name: name,
        email: email,
        document: document.replace(/\D/g, ''), // Remove formatting
        type: document.length > 11 ? 'CNPJ' : 'CPF'
      });

      if (response && (response.id || response.customer?._id)) {
        const customerId = response.id || response.customer._id;
        console.log('✅ Customer created/found:', customerId);
        return customerId;
      } else {
        console.error('❌ Failed to create customer:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Customer creation failed:', error);
      return null;
    }
  }

  async createDeposit(depositData: XGateDepositRequest): Promise<XGateDepositResponse> {
    try {
      console.log('💰 Creating XGate deposit:', depositData);
      
      // Get the full currency and crypto objects
      const brlCurrency = this.getBRLCurrency();
      const usdtCrypto = this.getUSDTCrypto();
      
      if (!brlCurrency || !usdtCrypto) {
        throw new Error('Currency or cryptocurrency not available');
      }
      
      const requestPayload = {
        amount: depositData.amount,
        customerId: depositData.customerId,
        currency: {
          _id: brlCurrency._id,
          name: brlCurrency.name,
          type: brlCurrency.type,
          symbol: brlCurrency.symbol
        },
        cryptocurrency: {
          _id: usdtCrypto._id,
          name: usdtCrypto.name,
          symbol: usdtCrypto.symbol,
          coinGecko: usdtCrypto.coinGecko || "tether"
        },
        webhookUrl: this.webhookUrl
      };
      
      console.log('📤 Sending deposit request:', JSON.stringify(requestPayload, null, 2));
      
      const response = await this.makeRequest('/deposit', 'POST', requestPayload);

      if (response && (response.id || response.data?.id)) {
        // Handle different response formats
        const depositData = response.data || response;
        
        return {
          success: true,
          data: {
            id: depositData.id || response.id,
            pixCode: depositData.code || depositData.pix_code || depositData.pixCode,
            status: depositData.status || 'WAITING_PAYMENT',
            amount: depositData.amount || depositData.amount,
            cryptoAmount: depositData.crypto_amount || depositData.cryptoAmount,
            expiresAt: depositData.expires_at || depositData.expiresAt,
            qrCodeUrl: depositData.qr_code_url || null
          }
        };
      } else {
        return { success: false, error: 'Invalid deposit response' };
      }
    } catch (error) {
      console.error('❌ Deposit creation failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}

// Singleton instance
let xgateService: XGateService | null = null;

export function getXGateService(): XGateService {
  if (!xgateService) {
    xgateService = new XGateService();
  }
  return xgateService;
}

export type { 
  XGateAuthResponse, 
  XGateCurrency, 
  XGateCrypto, 
  XGateCustomer, 
  XGateQuoteResponse, 
  XGateDepositResponse,
  XGateDepositRequest 
};