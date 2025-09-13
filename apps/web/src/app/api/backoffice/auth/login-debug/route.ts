import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';

// Mock admin users para desenvolvimento
const mockAdminUsers = [
  {
    id: 'admin-1',
    email: 'admin@nutz.com',
    password: 'admin123',
    name: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    isAdmin: true,
  },
  {
    id: 'admin-2',
    email: 'ops@nutz.com',
    password: 'ops123',
    name: 'Operations Admin',
    role: UserRole.OPERATIONS,
    isAdmin: true,
  },
  {
    id: 'admin-3',
    email: 'support@nutz.com',
    password: 'support123',
    name: 'Support User',
    role: UserRole.SUPPORT,
    isAdmin: true,
  },
];

export async function POST(request: NextRequest) {
  console.log('🔧 DEBUG LOGIN - Starting...');
  
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔧 DEBUG LOGIN - Credentials:', { email, password: '***' });

    // Buscar usuário admin
    const adminUser = mockAdminUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!adminUser) {
      console.log('🔧 DEBUG LOGIN - User not found');
      return NextResponse.json(
        { error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Verificar senha
    if (adminUser.password !== password) {
      console.log('🔧 DEBUG LOGIN - Invalid password');
      return NextResponse.json(
        { error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Login bem-sucedido - criar sessão
    const sessionToken = `admin-session-${adminUser.id}-${Date.now()}`;
    
    console.log('🔧 DEBUG LOGIN - Login successful, token:', sessionToken);

    const response = {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isAdmin: adminUser.isAdmin,
      },
      message: 'Login realizado com sucesso',
      sessionToken, // Incluindo no response para debug
    };

    // Criar resposta com cookie de sessão
    const nextResponse = NextResponse.json(response);
    
    // Definir cookie DE TESTE (não httpOnly para debug)
    nextResponse.cookies.set('backoffice-auth-token', sessionToken, {
      httpOnly: false, // APENAS PARA DEBUG - em produção deve ser true
      secure: false, // APENAS PARA DEBUG - em produção deve ser process.env.NODE_ENV === 'production'
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    // Também definir como httpOnly para o middleware
    nextResponse.cookies.set('backoffice-auth-token-http', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
    });

    console.log('🔧 DEBUG LOGIN - Response created with cookies');

    return nextResponse;
  } catch (error) {
    console.error('🔧 DEBUG LOGIN - Error:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}