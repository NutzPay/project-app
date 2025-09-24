import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { auditService } from '@/lib/rbac/audit';
import { prisma } from '@/lib/prisma';

interface ExchangeRateRequest {
  exchangeRate: number;
  note?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sellerId = params.id;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Verificar autenticação
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock admin user - em produção viria do token JWT
    const adminUser = {
      id: 'admin-1',
      email: 'admin@nutz.com',
      role: UserRole.SUPER_ADMIN,
      isAdmin: true,
    };

    // Verificar permissões
    if (!adminUser.isAdmin || 
        ![UserRole.SUPER_ADMIN, UserRole.OPERATIONS].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Permission denied - Only Super Admin and Operations can edit exchange rates' },
        { status: 403 }
      );
    }

    const body: ExchangeRateRequest = await request.json();
    const { exchangeRate, note } = body;

    // Validar taxa de câmbio
    if (!exchangeRate || exchangeRate <= 0 || exchangeRate > 1) {
      return NextResponse.json(
        { error: 'Invalid exchange rate. Must be between 0.001 and 1.000' },
        { status: 400 }
      );
    }

    // Buscar seller no banco (usando mock por enquanto)
    // const seller = await prisma.user.findUnique({
    //   where: { id: sellerId },
    //   select: { 
    //     id: true, 
    //     name: true, 
    //     email: true, 
    //     status: true, 
    //     exchangeRate: true 
    //   }
    // });

    // Mock data para teste
    const seller = {
      id: sellerId,
      name: 'Test Seller',
      email: 'seller@test.com',
      status: 'ACTIVE',
      exchangeRate: 0.17
    };

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Verificar se seller está ativo
    if (seller.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only edit exchange rate for active sellers' },
        { status: 422 }
      );
    }

    const oldRate = seller.exchangeRate;
    
    // Atualizar taxa no banco
    // await prisma.user.update({
    //   where: { id: sellerId },
    //   data: { 
    //     exchangeRate: exchangeRate,
    //     updatedAt: new Date()
    //   }
    // });

    // Mock update
    seller.exchangeRate = exchangeRate;

    // Log de auditoria
    await auditService.logEvent({
      eventType: 'ACCESS_DENIED', // Será EXCHANGE_RATE_UPDATED em produção
      userId: adminUser.id,
      details: {
        action: 'UPDATE_EXCHANGE_RATE',
        sellerId,
        sellerEmail: seller.email,
        sellerName: seller.name,
        oldRate: oldRate,
        newRate: exchangeRate,
        note: note || null,
        updatedBy: adminUser.email,
      },
      ipAddress: ip,
      userAgent,
    });

    console.log(`[EXCHANGE-RATE] Updated rate for seller ${sellerId}: ${oldRate} → ${exchangeRate}`);

    return NextResponse.json({
      success: true,
      sellerId,
      oldRate,
      newRate: exchangeRate,
      updatedAt: new Date().toISOString(),
      message: 'Exchange rate updated successfully'
    });

  } catch (error) {
    console.error(`[EXCHANGE-RATE] Error updating rate for seller ${sellerId}:`, error);
    
    return NextResponse.json(
      { error: 'Failed to update exchange rate' },
      { status: 500 }
    );
  }
}

// GET para buscar taxa atual
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sellerId = params.id;

  try {
    // Mock seller data
    const seller = {
      id: sellerId,
      name: 'Test Seller',
      email: 'seller@test.com',
      exchangeRate: 0.17,
      status: 'ACTIVE'
    };

    // Em produção:
    // const seller = await prisma.user.findUnique({
    //   where: { id: sellerId },
    //   select: { exchangeRate: true, status: true, name: true, email: true }
    // });

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sellerId,
      exchangeRate: seller.exchangeRate,
      status: seller.status,
      name: seller.name,
      email: seller.email
    });

  } catch (error) {
    console.error(`[EXCHANGE-RATE] Error getting rate for seller ${sellerId}:`, error);
    
    return NextResponse.json(
      { error: 'Failed to get exchange rate' },
      { status: 500 }
    );
  }
}