import { ApiResponse } from './types';

interface TransactionData {
  id: string;
  type: string;
  subtype: string;
  status: string;
  amount: number;
  description: string;
  createdAt: string;
  processedAt?: string;
  updatedAt: string;
}

interface TransactionsResponse {
  transactions: TransactionData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export async function fetchUserTransactions(
  filters?: TransactionFilters
): Promise<ApiResponse<TransactionsResponse>> {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    // Use local Next.js API route that handles authentication via cookies
    const url = `/api/transactions${params.toString() ? `?${params.toString()}` : ''}`;

    console.log('🔗 Calling API:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    console.log('📡 Response status:', response.status, response.statusText);

    const data = await response.json();
    console.log('📄 Response data:', data);

    // Handle specific HTTP status codes
    if (!response.ok) {
      const errorMessage = data.error || 'Erro ao buscar transações';

      switch (response.status) {
        case 401:
          console.log('🔒 Unauthorized - no valid auth cookie');
          return {
            success: false,
            error: 'Usuário não autenticado',
            data: null
          };
        case 403:
          console.log('🚫 Forbidden - insufficient permissions');
          return {
            success: false,
            error: 'Acesso negado',
            data: null
          };
        case 404:
          console.log('🔍 Not found - endpoint not available');
          return {
            success: false,
            error: 'Endpoint não encontrado',
            data: null
          };
        case 500:
          console.log('💥 Internal server error');
          return {
            success: false,
            error: 'Erro interno do servidor',
            data: null
          };
        default:
          console.log(`❌ HTTP ${response.status}:`, errorMessage);
          return {
            success: false,
            error: errorMessage,
            data: null
          };
      }
    }

    console.log('✅ API call successful');
    return data;

  } catch (error) {
    console.error('💥 Network/fetch error:', error);

    // Handle specific network errors
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'Falha na conexão com o servidor. Verifique sua internet.',
          data: null
        };
      } else if (error.message.includes('NetworkError')) {
        return {
          success: false,
          error: 'Erro de rede. Tente novamente.',
          data: null
        };
      }
    }

    return {
      success: false,
      error: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      data: null
    };
  }
}

// Transform API transaction data to match the frontend expected format
export function transformTransactionData(apiData: TransactionData) {
  // Map transaction types to frontend display format
  const typeMapping: Record<string, string> = {
    'DEPOSIT': 'deposit',
    'WITHDRAWAL': 'withdrawal',
    'BUY': 'exchange',
    'SELL': 'exchange',
    'TRANSFER': 'transfer',
  };

  // Map method based on transaction type
  const getMethod = (type: string, subtype: string) => {
    if (type === 'USDT') return 'USDT';
    if (type === 'PIX') return 'PIX';
    if (type === 'INVESTMENT') return 'INVESTMENT';
    return 'UNKNOWN';
  };

  return {
    id: apiData.id,
    date: apiData.createdAt,
    type: typeMapping[apiData.subtype] || 'transfer',
    method: getMethod(apiData.type, apiData.subtype),
    amount: apiData.amount,
    fee: 0, // Fee calculation would need to be added to API
    status: apiData.status.toLowerCase(),
    description: apiData.description || '',
    reference: apiData.id,
    wallet: apiData.type === 'USDT' ? 'USDT' : apiData.type === 'PIX' ? 'BRL' : 'OTHER',
    hash: '',
    fromAddress: '',
    toAddress: '',
    confirmations: apiData.status === 'COMPLETED' ? 12 : 0,
    network: apiData.type,
    cpf: '',
    customerName: '',
    origin: 'Nutz Platform'
  };
}