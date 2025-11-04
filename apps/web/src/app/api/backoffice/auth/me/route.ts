import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserType } from '@/types/rbac';
import { getCurrentBackofficeUser } from '@/lib/backoffice/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticação do backoffice usando JWT
    const backofficeUser = await getCurrentBackofficeUser(request);

    if (!backofficeUser) {
      console.log('❌ /api/backoffice/auth/me: No authenticated user');
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    console.log('✅ /api/backoffice/auth/me: User authenticated:', backofficeUser.email);

    // Verificar se é admin (SUPER_ADMIN, ADMIN ou OWNER)
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(backofficeUser.role);

    if (!isAdmin) {
      console.log('❌ /api/backoffice/auth/me: User is not admin:', backofficeUser.role);
      return NextResponse.json(
        { error: 'Access denied', code: 'NOT_ADMIN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: backofficeUser.id,
      email: backofficeUser.email,
      name: backofficeUser.name,
      role: backofficeUser.role,
      userType: UserType.ADMIN_INTERNAL,
      isAdmin: true,
      isSeller: false,
      status: 'ACTIVE',
    });
  } catch (error) {
    console.error('❌ Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}