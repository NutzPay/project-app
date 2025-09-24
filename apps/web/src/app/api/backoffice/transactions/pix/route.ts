import { NextRequest, NextResponse } from 'next/server';

const mockPIXTransactions = [
  {
    id: 'pix-001',
    pixTransactionId: 'PIX-2024-001',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 500.00,
    brlAmount: 500.00,
    description: 'Depósito PIX',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-001',
      name: 'Maria Silva',
      email: 'maria@email.com'
    }
  },
  {
    id: 'pix-002',
    pixTransactionId: 'PIX-2024-002',
    type: 'WITHDRAWAL',
    status: 'PENDING',
    amount: 200.00,
    brlAmount: 200.00,
    description: 'Saque PIX',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: {
      id: 'user-002',
      name: 'João Santos',
      email: 'joao@email.com'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const status = searchParams.get('status');

    // Filtrar transações mock
    let filteredTransactions = [...mockPIXTransactions];

    if (status) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }

    const totalCount = filteredTransactions.length;
    const offset = (page - 1) * limit;
    const transactions = filteredTransactions.slice(offset, offset + limit);

    const stats = {
      total: totalCount,
      completedToday: filteredTransactions.filter(tx => tx.status === 'COMPLETED').length,
      pending: filteredTransactions.filter(tx => tx.status === 'PENDING').length,
      failed: filteredTransactions.filter(tx => tx.status === 'FAILED').length,
      volumeToday: filteredTransactions
        .filter(tx => tx.status === 'COMPLETED')
        .reduce((sum, tx) => sum + tx.brlAmount, 0)
    };

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats
    });

  } catch (error) {
    console.error('❌ Error loading PIX transactions:', error);
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