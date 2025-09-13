import { NextRequest, NextResponse } from 'next/server';
import { impersonationService } from '@/lib/rbac/impersonation';
import { UserRole } from '@/types/rbac';

export async function POST(request: NextRequest) {
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

    // Verificar se tem permissão para impersonar
    if (!adminUser.isAdmin || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(adminUser.role)) {
      return NextResponse.json(
        { error: 'Permission denied', code: 'NO_IMPERSONATION_PERMISSION' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sellerUserId, sellerEmail } = body;

    if (!sellerUserId || !sellerEmail) {
      return NextResponse.json(
        { error: 'Seller ID and email are required', code: 'MISSING_SELLER_INFO' },
        { status: 400 }
      );
    }

    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Iniciar impersonação
    const { sessionToken, dashboardUrl } = await impersonationService.startImpersonation(
      adminUser.id,
      sellerUserId,
      sellerEmail,
      ip,
      userAgent
    );

    return NextResponse.json({
      success: true,
      sessionToken,
      dashboardUrl,
      message: `Impersonation started for seller ${sellerEmail}`,
    });
  } catch (error: any) {
    console.error('Impersonation start error:', error);
    
    if (error.message === 'Seller already has an active impersonation session') {
      return NextResponse.json(
        { error: error.message, code: 'ACTIVE_SESSION_EXISTS' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start impersonation', code: 'IMPERSONATION_ERROR' },
      { status: 500 }
    );
  }
}