import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;

    const stats = {
      total: 15234,
      today: 342,
      alerts: 3,
      errors: 8
    };

    const mockLogs = [
      {
        id: 'log-001',
        type: 'user_login',
        action: 'LOGIN',
        description: 'Login realizado: admin@nutz.com',
        user: {
          id: 'admin-001',
          email: 'admin@nutz.com',
          name: 'Admin User'
        },
        metadata: {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          location: 'São Paulo, BR'
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'log-002',
        type: 'seller_approval',
        action: 'APPROVE_SELLER',
        description: 'Seller aprovado: João Silva',
        user: {
          id: 'admin-001',
          email: 'admin@nutz.com',
          name: 'Admin User'
        },
        metadata: {
          sellerId: 'seller-123',
          sellerName: 'João Silva',
          sellerEmail: 'joao@email.com'
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      },
      {
        id: 'log-003',
        type: 'config_change',
        action: 'UPDATE_CONFIG',
        description: 'Configuração alterada: Taxa PIX',
        user: {
          id: 'admin-002',
          email: 'super@nutz.com',
          name: 'Super Admin'
        },
        metadata: {
          configKey: 'pix_fee_rate',
          oldValue: '0.5',
          newValue: '0.45'
        },
        severity: 'warning',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 'log-004',
        type: 'transaction_error',
        action: 'TRANSACTION_FAILED',
        description: 'Falha no processamento de transação PIX',
        user: null,
        metadata: {
          transactionId: 'tx-456',
          errorCode: 'PIX_TIMEOUT',
          amount: 1000.00
        },
        severity: 'error',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'log-005',
        type: 'user_creation',
        action: 'CREATE_USER',
        description: 'Novo usuário criado no sistema',
        user: {
          id: 'admin-001',
          email: 'admin@nutz.com',
          name: 'Admin User'
        },
        metadata: {
          newUserId: 'user-789',
          newUserEmail: 'maria@email.com',
          userType: 'seller'
        },
        severity: 'info',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString()
      }
    ];

    const total = mockLogs.length;
    const paginatedLogs = mockLogs.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      stats,
      pagination: {
        total,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error('❌ Error loading audit logs:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}