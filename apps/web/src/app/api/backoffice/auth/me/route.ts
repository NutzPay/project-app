import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserType } from '@/types/rbac';

// Mock user data - em produção viria do banco de dados
const MOCK_ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@nutz.com',
  name: 'Admin User',
  role: UserRole.SUPER_ADMIN,
  userType: UserType.ADMIN_INTERNAL,
  isAdmin: true,
  isSeller: false,
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticação do backoffice
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Em produção, verificar o token JWT e buscar o usuário do banco
    // const { verifyBackofficeToken } = await import('@/lib/backoffice/auth');
    // const user = await verifyBackofficeToken(token);

    // Para desenvolvimento, retornar mock user
    const user = MOCK_ADMIN_USER;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (!user.isAdmin || user.isSeller) {
      return NextResponse.json(
        { error: 'Access denied', code: 'NOT_ADMIN' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      userType: user.userType,
      isAdmin: user.isAdmin,
      isSeller: user.isSeller,
      status: user.status,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}