import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';

interface SellerDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountType?: string;
  document?: string;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  lastLoginIp?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    name: string;
    status: string;
    document: string;
    email: string;
    planId?: string;
    subscriptionId?: string;
    monthlyLimit?: number;
    dailyLimit?: number;
    createdAt: string;
  };
  dealSummary: {
    totalVolume: number;
    totalDeals: number;
    activeDeals: number;
    completedDeals: number;
    cancelledDeals: number;
    lastDealDate?: string;
    averageDealSize: number;
    topCategories: Array<{
      category: string;
      volume: number;
      count: number;
    }>;
  };
  usdtWallet?: {
    balance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalTransacted: number;
    lastTransactionDate?: string;
    walletAddress?: string;
  };
  apiKeys: Array<{
    id: string;
    name: string;
    keyPreview: string;
    status: string;
    lastUsedAt?: string;
    createdAt: string;
  }>;
  webhooks: Array<{
    id: string;
    url: string;
    events: string[];
    status: string;
    lastTriggeredAt?: string;
    createdAt: string;
  }>;
  activitySummary: {
    totalLogins: number;
    lastLoginDaysAgo: number;
    averageSessionDuration: number;
    mostUsedFeatures: string[];
  };
  riskAnalysis: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
    lastReviewDate: string;
  };
}

// Mock data detalhado para desenvolvimento
const mockSellerDetails: Record<string, SellerDetail> = {
  'seller-001': {
    id: 'seller-001',
    name: 'João Silva Santos',
    email: 'joao.silva@empresa1.com.br',
    role: 'SELLER',
    status: 'ACTIVE',
    accountType: 'PJ',
    document: '12.345.678/0001-90',
    emailVerified: true,
    emailVerifiedAt: '2024-01-15T11:30:00Z',
    lastLoginAt: '2024-08-24T08:30:00Z',
    lastLoginIp: '192.168.1.100',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-24T08:30:00Z',
    company: {
      id: 'comp-001',
      name: 'Silva & Associados Ltda',
      status: 'ACTIVE',
      document: '12.345.678/0001-90',
      email: 'contato@silvaassociados.com.br',
      planId: 'plan-business',
      monthlyLimit: 500000,
      dailyLimit: 50000,
      createdAt: '2024-01-15T09:45:00Z',
    },
    dealSummary: {
      totalVolume: 245000.50,
      totalDeals: 47,
      activeDeals: 12,
      completedDeals: 32,
      cancelledDeals: 3,
      lastDealDate: '2024-08-23T15:22:00Z',
      averageDealSize: 5212.78,
      topCategories: [
        { category: 'E-commerce', volume: 120000.30, count: 23 },
        { category: 'Serviços', volume: 89500.20, count: 18 },
        { category: 'Produtos Digitais', volume: 35500.00, count: 6 },
      ],
    },
    usdtWallet: {
      balance: 15420.75,
      totalDeposited: 125000.00,
      totalWithdrawn: 109579.25,
      totalTransacted: 234579.25,
      lastTransactionDate: '2024-08-23T14:15:00Z',
      walletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
    apiKeys: [
      {
        id: 'key-001',
        name: 'Produção Principal',
        keyPreview: 'nz_live_**********************abc123',
        status: 'ACTIVE',
        lastUsedAt: '2024-08-24T08:15:00Z',
        createdAt: '2024-01-20T14:00:00Z',
      },
      {
        id: 'key-002',
        name: 'Teste Webhooks',
        keyPreview: 'nz_test_**********************def456',
        status: 'ACTIVE',
        lastUsedAt: '2024-08-22T16:30:00Z',
        createdAt: '2024-02-10T10:15:00Z',
      },
    ],
    webhooks: [
      {
        id: 'hook-001',
        url: 'https://api.silvaassociados.com.br/webhooks/nutz',
        events: ['payment.completed', 'payment.failed', 'refund.processed'],
        status: 'ACTIVE',
        lastTriggeredAt: '2024-08-23T15:22:00Z',
        createdAt: '2024-01-25T11:00:00Z',
      },
    ],
    activitySummary: {
      totalLogins: 127,
      lastLoginDaysAgo: 0,
      averageSessionDuration: 45,
      mostUsedFeatures: ['Dashboard', 'Transações', 'Relatórios', 'API Keys'],
    },
    riskAnalysis: {
      riskLevel: 'LOW',
      factors: ['Email verificado', 'Histórico consistente', 'Volume dentro da média'],
      lastReviewDate: '2024-08-20T10:00:00Z',
    },
  },
  'seller-002': {
    id: 'seller-002',
    name: 'Maria Fernanda Costa',
    email: 'maria.costa@inovacorp.com.br',
    role: 'OWNER',
    status: 'ACTIVE',
    accountType: 'PJ',
    document: '98.765.432/0001-10',
    emailVerified: true,
    emailVerifiedAt: '2024-02-03T15:00:00Z',
    lastLoginAt: '2024-08-24T09:15:00Z',
    lastLoginIp: '10.0.0.25',
    createdAt: '2024-02-03T14:30:00Z',
    updatedAt: '2024-08-24T09:15:00Z',
    company: {
      id: 'comp-002',
      name: 'Inovacorp Tecnologia SA',
      status: 'ACTIVE',
      document: '98.765.432/0001-10',
      email: 'admin@inovacorp.com.br',
      planId: 'plan-enterprise',
      monthlyLimit: 1000000,
      dailyLimit: 100000,
      createdAt: '2024-02-03T14:00:00Z',
    },
    dealSummary: {
      totalVolume: 580000.00,
      totalDeals: 89,
      activeDeals: 23,
      completedDeals: 62,
      cancelledDeals: 4,
      lastDealDate: '2024-08-24T07:45:00Z',
      averageDealSize: 6516.85,
      topCategories: [
        { category: 'SaaS', volume: 320000.00, count: 45 },
        { category: 'Consultoria', volume: 180000.00, count: 28 },
        { category: 'Licenças', volume: 80000.00, count: 16 },
      ],
    },
    usdtWallet: {
      balance: 28750.40,
      totalDeposited: 200000.00,
      totalWithdrawn: 171249.60,
      totalTransacted: 371249.60,
      lastTransactionDate: '2024-08-24T07:00:00Z',
      walletAddress: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
    },
    apiKeys: [
      {
        id: 'key-003',
        name: 'API Principal',
        keyPreview: 'nz_live_**********************xyz789',
        status: 'ACTIVE',
        lastUsedAt: '2024-08-24T09:00:00Z',
        createdAt: '2024-02-05T16:30:00Z',
      },
    ],
    webhooks: [
      {
        id: 'hook-002',
        url: 'https://webhooks.inovacorp.com.br/nutz/events',
        events: ['payment.completed', 'subscription.updated', 'refund.processed'],
        status: 'ACTIVE',
        lastTriggeredAt: '2024-08-24T07:45:00Z',
        createdAt: '2024-02-08T12:00:00Z',
      },
    ],
    activitySummary: {
      totalLogins: 203,
      lastLoginDaysAgo: 0,
      averageSessionDuration: 62,
      mostUsedFeatures: ['Dashboard', 'Relatórios', 'Configurações', 'Webhooks'],
    },
    riskAnalysis: {
      riskLevel: 'LOW',
      factors: ['Cliente enterprise', 'Volume alto mas consistente', 'Configurações avançadas'],
      lastReviewDate: '2024-08-21T09:30:00Z',
    },
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const sellerId = params.id;
  
  try {
    // Verificar autenticação do admin
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Mock admin user - em produção viria do token JWT
    const adminUser = {
      id: 'admin-1',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    if (!adminUser.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required', code: 'NOT_ADMIN' },
        { status: 403 }
      );
    }

    // Em produção, buscar do banco de dados:
    // const seller = await prisma.user.findUnique({
    //   where: { id: sellerId },
    //   include: { company: true, apiKeys: true, webhooks: true, ... }
    // });

    const sellerDetail = mockSellerDetails[sellerId];
    
    if (!sellerDetail) {
      return NextResponse.json(
        { error: 'Seller not found', code: 'SELLER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const responseTime = Date.now() - startTime;
    console.log(`[SELLER-DETAIL] Fetched seller ${sellerId} in ${responseTime}ms`);

    return NextResponse.json(sellerDetail);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[SELLER-DETAIL] Error fetching seller ${sellerId} after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to fetch seller details', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}