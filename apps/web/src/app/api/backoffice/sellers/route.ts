import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserType } from '@/types/rbac';
import { prisma } from '@/lib/prisma';

interface SellerSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  accountType?: string;
  document?: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  // Fee Configuration (will be available when fee system is implemented)
  company?: {
    id: string;
    name: string;
    status: string;
    document: string;
  };
  dealSummary?: {
    totalVolume: number;
    activeDeals: number;
    lastDealDate?: string;
  };
  usdtWallet?: {
    balance: number;
    totalTransacted: number;
  };
}

interface SellerListResponse {
  sellers: SellerSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  stats: {
    totalSellers: number;
    activeSellers: number;
    pendingSellers: number;
    suspendedSellers: number;
  };
  filters: {
    status?: string;
    role?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    hasWallet?: boolean;
    emailVerified?: boolean;
  };
}

// Mock data para desenvolvimento - em produção, buscar do banco de dados
const mockSellers: SellerSummary[] = [
  {
    id: 'seller-001',
    name: 'João Silva Santos',
    email: 'joao.silva@empresa1.com.br',
    role: 'SELLER',
    status: 'ACTIVE',
    accountType: 'PJ',
    document: '12.345.678/0001-90',
    emailVerified: true,
    lastLoginAt: '2024-08-24T08:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-08-24T08:30:00Z',
    company: {
      id: 'comp-001',
      name: 'Silva & Associados Ltda',
      status: 'ACTIVE',
      document: '12.345.678/0001-90',
    },
    dealSummary: {
      totalVolume: 245000.50,
      activeDeals: 12,
      lastDealDate: '2024-08-23T15:22:00Z',
    },
    usdtWallet: {
      balance: 15420.75,
      totalTransacted: 89332.20,
    },
  },
  {
    id: 'seller-002',
    name: 'Maria Fernanda Costa',
    email: 'maria.costa@inovacorp.com.br',
    role: 'OWNER',
    status: 'ACTIVE',
    accountType: 'PJ',
    document: '98.765.432/0001-10',
    emailVerified: true,
    lastLoginAt: '2024-08-24T09:15:00Z',
    createdAt: '2024-02-03T14:30:00Z',
    updatedAt: '2024-08-24T09:15:00Z',
    company: {
      id: 'comp-002',
      name: 'Inovacorp Tecnologia SA',
      status: 'ACTIVE',
      document: '98.765.432/0001-10',
    },
    dealSummary: {
      totalVolume: 580000.00,
      activeDeals: 23,
      lastDealDate: '2024-08-24T07:45:00Z',
    },
    usdtWallet: {
      balance: 28750.40,
      totalTransacted: 156890.80,
    },
  },
  {
    id: 'seller-003',
    name: 'Carlos Eduardo Oliveira',
    email: 'carlos.oliveira@startup123.com',
    role: 'MEMBER',
    status: 'PENDING',
    accountType: 'PF',
    document: '123.456.789-00',
    emailVerified: false,
    lastLoginAt: undefined,
    createdAt: '2024-08-20T16:45:00Z',
    updatedAt: '2024-08-20T16:45:00Z',
    company: {
      id: 'comp-003',
      name: 'Startup 123 EIRELI',
      status: 'PENDING_VERIFICATION',
      document: '11.222.333/0001-44',
    },
    dealSummary: {
      totalVolume: 0,
      activeDeals: 0,
      lastDealDate: undefined,
    },
    usdtWallet: {
      balance: 0,
      totalTransacted: 0,
    },
  },
  {
    id: 'seller-004',
    name: 'Ana Paula Rodrigues',
    email: 'ana.rodrigues@megacorp.com.br',
    role: 'SELLER',
    status: 'SUSPENDED',
    accountType: 'PJ',
    document: '55.666.777/0001-88',
    emailVerified: true,
    lastLoginAt: '2024-08-15T12:20:00Z',
    createdAt: '2024-03-10T11:15:00Z',
    updatedAt: '2024-08-22T14:30:00Z',
    company: {
      id: 'comp-004',
      name: 'MegaCorp Soluções Ltda',
      status: 'SUSPENDED',
      document: '55.666.777/0001-88',
    },
    dealSummary: {
      totalVolume: 125000.75,
      activeDeals: 0,
      lastDealDate: '2024-08-15T10:30:00Z',
    },
    usdtWallet: {
      balance: 2340.15,
      totalTransacted: 45670.90,
    },
  },
  {
    id: 'seller-005',
    name: 'Roberto Martinez Silva',
    email: 'roberto.martinez@globaltech.com',
    role: 'OWNER',
    status: 'ACTIVE',
    accountType: 'PJ',
    document: '77.888.999/0001-22',
    emailVerified: true,
    lastLoginAt: '2024-08-24T07:00:00Z',
    createdAt: '2024-01-08T09:30:00Z',
    updatedAt: '2024-08-24T07:00:00Z',
    company: {
      id: 'comp-005',
      name: 'GlobalTech International SA',
      status: 'ACTIVE',
      document: '77.888.999/0001-22',
    },
    dealSummary: {
      totalVolume: 890000.25,
      activeDeals: 35,
      lastDealDate: '2024-08-24T06:15:00Z',
    },
    usdtWallet: {
      balance: 45600.80,
      totalTransacted: 234567.45,
    },
  },
];

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Por agora, remover autenticação para debugging
    // const token = request.cookies.get('backoffice-auth-token')?.value;

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;
    
    const filters = {
      status: searchParams.get('status') || undefined,
      role: searchParams.get('role') || undefined,
      search: searchParams.get('search') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      hasWallet: searchParams.get('hasWallet') === 'true' || undefined,
      emailVerified: searchParams.get('emailVerified') === 'true' || undefined,
    };

    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause para Prisma
    const where: any = {};
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.role) {
      where.role = filters.role;
    }
    
    if (searchParams.get('emailVerified') !== null) {
      where.emailVerified = filters.emailVerified;
    }
    
    if (filters.dateFrom) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
    }
    
    if (filters.dateTo) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
    }

    // Build orderBy para Prisma
    const orderBy: any = {};
    if (sortBy === 'company.name') {
      orderBy.companyName = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'email') {
      orderBy.email = sortOrder;
    } else if (sortBy === 'status') {
      orderBy.status = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Query para buscar usuários reais do banco
    let users, totalCount;

    try {
      [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            accountType: true,
            document: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
            companyName: true,
          },
          orderBy,
          skip: offset,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);
    } catch (error) {
      console.error('Database error:', error);
      users = [];
      totalCount = 0;
    }

    // Get stats
    let statsData = [];
    try {
      if (totalCount > 0 && users.some(u => u.id.startsWith('cmf'))) {
        // Real data from database
        statsData = await prisma.user.groupBy({
          by: ['status'],
          _count: true,
        });
      }
    } catch (error) {
      console.log('Stats error:', error);
    }

    const stats = {
      totalSellers: totalCount,
      activeSellers: totalCount > 0 ? users.filter(u => u.status === 'ACTIVE').length : 0,
      pendingSellers: totalCount > 0 ? users.filter(u => u.status === 'PENDING').length : 0,
      suspendedSellers: totalCount > 0 ? users.filter(u => u.status === 'SUSPENDED').length : 0,
    };

    // Format users data - simplificado
    const paginatedSellers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      accountType: user.accountType || undefined,
      document: user.document || undefined,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      // Fee Configuration (to be implemented later)
      company: user.companyName ? {
        id: 'temp',
        name: user.companyName,
        status: 'ACTIVE',
        document: user.document || '',
      } : undefined,
      dealSummary: {
        totalVolume: 0,
        activeDeals: 0,
        lastDealDate: undefined,
      },
      usdtWallet: {
        balance: 0,
        totalTransacted: 0,
      },
    }));

    const totalPages = Math.ceil(totalCount / limit);

    const responseTime = Date.now() - startTime;
    console.log(`[SELLERS-API] Query completed in ${responseTime}ms. Results: ${paginatedSellers.length}/${totalCount}`);

    const response: SellerListResponse = {
      sellers: paginatedSellers,
      pagination: {
        total: totalCount,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats,
      filters: {
        ...filters,
        hasWallet: filters.hasWallet || undefined,
        emailVerified: searchParams.get('emailVerified') !== null ? filters.emailVerified : undefined,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[SELLERS-API] Error after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Failed to fetch sellers', code: 'FETCH_ERROR' },
      { status: 500 }
    );
  }
}