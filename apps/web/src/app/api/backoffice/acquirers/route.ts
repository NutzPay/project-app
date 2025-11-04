import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/backoffice/acquirers - List all payment acquirers
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const acquirers = await prisma.paymentAcquirer.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            userAcquirers: true,
            transactions: true
          }
        }
      }
    });

    // Transform the response to include safe data (hide sensitive API keys)
    const safeAcquirers = acquirers.map((acquirer: typeof acquirers[number]) => ({
      ...acquirer,
      apiConfig: acquirer.apiConfig ? '***configured***' : null,
      _count: acquirer._count
    }));

    return NextResponse.json({
      success: true,
      acquirers: safeAcquirers
    });

  } catch (error) {
    console.error('❌ Error fetching acquirers:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/backoffice/acquirers - Create or update payment acquirer
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const {
      id,
      name,
      slug,
      type,
      status,
      apiConfig,
      feeConfig,
      testMode,
      supportsDeposits,
      supportsWithdrawals,
      supportsWebhooks,
      description,
      logoUrl,
      documentationUrl
    } = await request.json();

    // Validation
    if (!name || !slug || !type) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios: name, slug, type' },
        { status: 400 }
      );
    }

    if (!['PIX', 'CRYPTO', 'TRADITIONAL'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo inválido. Use: PIX, CRYPTO, TRADITIONAL' },
        { status: 400 }
      );
    }

    if (status && !['ACTIVE', 'INACTIVE', 'ERROR', 'TESTING'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      );
    }

    let acquirer;

    if (id) {
      // Update existing acquirer
      acquirer = await prisma.paymentAcquirer.update({
        where: { id },
        data: {
          name,
          slug,
          type,
          status: status || 'INACTIVE',
          apiConfig: apiConfig ? JSON.stringify(apiConfig) : null,
          feeConfig: feeConfig ? JSON.stringify(feeConfig) : null,
          testMode: testMode ?? true,
          supportsDeposits: supportsDeposits ?? true,
          supportsWithdrawals: supportsWithdrawals ?? true,
          supportsWebhooks: supportsWebhooks ?? true,
          description,
          logoUrl,
          documentationUrl,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new acquirer
      acquirer = await prisma.paymentAcquirer.create({
        data: {
          name,
          slug,
          type,
          status: status || 'INACTIVE',
          apiConfig: apiConfig ? JSON.stringify(apiConfig) : null,
          feeConfig: feeConfig ? JSON.stringify(feeConfig) : null,
          testMode: testMode ?? true,
          supportsDeposits: supportsDeposits ?? true,
          supportsWithdrawals: supportsWithdrawals ?? true,
          supportsWebhooks: supportsWebhooks ?? true,
          description,
          logoUrl,
          documentationUrl
        }
      });
    }

    // Return safe data (hide sensitive API config)
    const safeAcquirer = {
      ...acquirer,
      apiConfig: acquirer.apiConfig ? '***configured***' : null
    };

    console.log(`✅ Acquirer ${id ? 'updated' : 'created'}: ${acquirer.slug}`);

    return NextResponse.json({
      success: true,
      acquirer: safeAcquirer
    });

  } catch (error) {
    console.error('❌ Error creating/updating acquirer:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}