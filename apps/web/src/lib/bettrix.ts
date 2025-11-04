/**
 * Bettrix API Integration Service
 * Handles Cash-In, Cash-Out, balance and transaction management
 */

const BETTRIX_CASH_IN_URL = 'https://cashin.safepayments.cloud';
const BETTRIX_CASH_OUT_URL = 'https://cashout.safepayments.cloud';
const BETTRIX_API_KEY = 'u74I6+8FQ99eZCVVfzFBuIRsDmicEdkscLlr/F81FyP+OERNRwgV4ZyZNQdt0HJi';

interface BettrixCashInRequest {
  ExternalId: string; // Required by Bettrix - PascalCase!
  payerName: string;
  payerDocument: string;
  payerEmail: string;
  payerPhone: string;
  productName: string;
  productDescription: string;
  value: number; // in cents
  orderId: string; // Required by Bettrix API
  postbackUrl?: string;
  splits?: Array<{
    clientId: string;
    value: number;
  }>;
}

interface BettrixCashInResponse {
  transactionId: number;
  externalId: string;
  orderId: string;
  qrCode: string;
  qrCodeBase64: string;
}

interface BettrixCashOutRequest {
  value: number; // in cents
  pixKeyType: 0 | 1 | 2 | 3 | 4; // 0=CPF, 1=CNPJ, 2=EMAIL, 3=TELEFONE, 4=RANDOM_KEY
  pixKey: string;
  cpfCnpj: string;
  person: {
    name: string;
    email: string;
    phone: string;
  };
  orderId: string;
  postbackUrl?: string;
}

interface BettrixCashOutResponse {
  transactionId: number;
  orderId: string;
  gross: number;
  tax: string;
  liquid: string;
  status: string; // 0=Pending, 1=Paid, 2=Failed, 3=Canceled, 4=Refund
  createdAt: string;
  success: string;
  description: string | null;
}

interface BettrixTransactionResponse {
  transactionId: number;
  orderId: string;
  object: 'cashin' | 'transfer';
  status: 'paid' | 'pending' | 'failed' | 'created';
  method: 'pix';
  value: number;
  endToEndId?: string;
  processedAt?: string;
}

interface BettrixBalanceResponse {
  balance: number;
  retention: number;
  toAnticipate: number;
  finalBalance: number;
}

class BettrixService {
  private async makeRequest(
    url: string,
    method: 'GET' | 'POST',
    data?: any
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${BETTRIX_API_KEY}`,
        'Content-Type': 'application/json',
      };

      const config: RequestInit = {
        method,
        headers,
      };

      if (data && method === 'POST') {
        config.body = JSON.stringify(data);
        console.log('📤 STRINGIFIED BODY:', config.body);
      }

      console.log(`🔄 Making ${method} request to Bettrix:`, url);
      console.log('📋 Request data:', data);

      const response = await fetch(url, config);

      // Try to parse response - it might be HTML on error
      const responseText = await response.text();
      console.log('📄 Raw response:', responseText.substring(0, 500));

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse Bettrix response as JSON');
        console.error('Response was:', responseText.substring(0, 1000));
        throw new Error(`API Bettrix retornou resposta inválida: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('❌ Bettrix API error:', responseData);
        throw new Error(responseData.message || `HTTP ${response.status}`);
      }

      console.log('✅ Bettrix API response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Error calling Bettrix API:', error);
      throw error;
    }
  }

  /**
   * Create a PIX Cash-In transaction (QR Code for payment)
   */
  async createCashIn(params: {
    amount: number; // in BRL, will be converted to cents
    payerName: string;
    payerDocument: string;
    payerEmail: string;
    payerPhone: string;
    description: string;
    orderId: string;
    postbackUrl?: string;
  }): Promise<BettrixCashInResponse> {
    const requestData: BettrixCashInRequest = {
      ExternalId: params.orderId, // Required by Bettrix API - PascalCase!
      payerName: params.payerName,
      payerDocument: params.payerDocument.replace(/\D/g, ''), // Remove formatting
      payerEmail: params.payerEmail,
      payerPhone: params.payerPhone.replace(/\D/g, ''), // Remove formatting
      productName: 'Depósito PIX',
      productDescription: params.description,
      value: Math.round(params.amount * 100), // Convert to cents
      orderId: params.orderId, // Required per Bettrix documentation
      postbackUrl: params.postbackUrl,
    };

    console.log('🔍 DEBUG: Request data being sent to Bettrix:', JSON.stringify(requestData, null, 2));
    console.log('🔍 DEBUG: Has ExternalId?', !!requestData.ExternalId, 'Value:', requestData.ExternalId);

    return this.makeRequest(
      `${BETTRIX_CASH_IN_URL}/transaction/qrcode/cashin`,
      'POST',
      requestData
    );
  }

  /**
   * Create a PIX Cash-Out transaction (send money)
   */
  async createCashOut(params: {
    amount: number; // in BRL, will be converted to cents
    pixKey: string;
    pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    recipientDocument: string;
    recipientName: string;
    recipientEmail: string;
    recipientPhone: string;
    orderId: string;
    postbackUrl?: string;
  }): Promise<BettrixCashOutResponse> {
    // Map pixKeyType to Bettrix enum
    const pixKeyTypeMap = {
      cpf: 0,
      cnpj: 1,
      email: 2,
      phone: 3,
      random: 4,
    };

    const requestData: BettrixCashOutRequest = {
      value: Math.round(params.amount * 100), // Convert to cents
      pixKeyType: pixKeyTypeMap[params.pixKeyType],
      pixKey: params.pixKey,
      cpfCnpj: params.recipientDocument.replace(/\D/g, ''), // Remove formatting
      person: {
        name: params.recipientName,
        email: params.recipientEmail,
        phone: params.recipientPhone.replace(/\D/g, ''), // Remove formatting
      },
      orderId: params.orderId,
      postbackUrl: params.postbackUrl,
    };

    return this.makeRequest(
      `${BETTRIX_CASH_OUT_URL}/transaction/cashout`,
      'POST',
      requestData
    );
  }

  /**
   * Get transaction details by ID or orderId
   */
  async getTransaction(
    identifier: string,
    type: 'id' | 'orderId' = 'id',
    endpoint: 'cashin' | 'cashout' = 'cashin'
  ): Promise<BettrixTransactionResponse> {
    const baseUrl = endpoint === 'cashin' ? BETTRIX_CASH_IN_URL : BETTRIX_CASH_OUT_URL;
    const url = `${baseUrl}/transaction/get/by/${type}/${identifier}`;

    return this.makeRequest(url, 'GET');
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<BettrixBalanceResponse> {
    return this.makeRequest(
      `${BETTRIX_CASH_OUT_URL}/transaction/get/balance`,
      'GET'
    );
  }

  /**
   * Determine PIX key type based on the key format
   */
  determinePixKeyType(pixKey: string): 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' {
    // Remove formatting
    const cleanKey = pixKey.replace(/\D/g, '');

    // Check if it's a CPF (11 digits)
    if (/^\d{11}$/.test(cleanKey)) {
      return 'cpf';
    }

    // Check if it's a CNPJ (14 digits)
    if (/^\d{14}$/.test(cleanKey)) {
      return 'cnpj';
    }

    // Check if it's an email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pixKey)) {
      return 'email';
    }

    // Check if it's a phone (with country code, 13 digits)
    if (/^\d{10,13}$/.test(cleanKey)) {
      return 'phone';
    }

    // Otherwise, assume it's a random key
    return 'random';
  }

  /**
   * Convert Bettrix status to our internal status
   */
  mapStatus(bettrixStatus: string | number): 'pending' | 'completed' | 'failed' | 'cancelled' {
    // Convert to string and lowercase for comparison
    const statusStr = String(bettrixStatus).toLowerCase();

    switch (statusStr) {
      case 'paid':
      case '1':
        return 'completed';
      case 'pending':
      case 'created':
      case '0':
        return 'pending';
      case 'failed':
      case '2':
        return 'failed';
      case 'canceled':
      case 'cancelled':
      case '3':
      case 'refund':
      case '4':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}

export const bettrixService = new BettrixService();
export type {
  BettrixCashInRequest,
  BettrixCashInResponse,
  BettrixCashOutRequest,
  BettrixCashOutResponse,
  BettrixTransactionResponse,
  BettrixBalanceResponse,
};