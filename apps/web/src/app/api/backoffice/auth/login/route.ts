import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';

// Simple UUID generator for server-side use
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple audit logging for development
function logAuditEvent(event: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp}:`, JSON.stringify(event, null, 2));
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isAdmin: boolean;
  };
  message: string;
}

// Mock admin users para desenvolvimento
const mockAdminUsers = [
  {
    id: 'admin-1',
    email: 'admin@nutz.com',
    password: 'admin123', // Em produção seria hash
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
  const startTime = Date.now();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validações básicas
    if (!email || !password) {
      logAuditEvent({
        eventType: 'LOGIN_ATTEMPT',
        userId: 'unknown',
        action: 'BACKOFFICE_LOGIN',
        email: email || 'empty',
        reason: 'Missing email or password',
        success: false,
        ipAddress: ip,
        userAgent,
      });

      return NextResponse.json(
        { error: 'Email e senha são obrigatórios', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }

    // Buscar usuário admin
    const adminUser = mockAdminUsers.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );

    if (!adminUser) {
      logAuditEvent({
        eventType: 'LOGIN_ATTEMPT',
        userId: 'unknown',
        action: 'BACKOFFICE_LOGIN',
        email,
        reason: 'Admin user not found',
        success: false,
        ipAddress: ip,
        userAgent,
      });

      // Delay para prevenir timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Verificar senha (em produção seria bcrypt.compare)
    if (adminUser.password !== password) {
      logAuditEvent({
        eventType: 'LOGIN_ATTEMPT',
        userId: adminUser.id,
        action: 'BACKOFFICE_LOGIN',
        email,
        reason: 'Invalid password',
        success: false,
        ipAddress: ip,
        userAgent,
      });

      // Delay para prevenir timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }

    // Login bem-sucedido - criar sessão
    const sessionToken = `admin-session-${adminUser.id}-${Date.now()}`;
    
    // Log de auditoria para login bem-sucedido
    logAuditEvent({
      eventType: 'LOGIN_ATTEMPT',
      userId: adminUser.id,
      action: 'BACKOFFICE_LOGIN',
      email,
      name: adminUser.name,
      role: adminUser.role,
      success: true,
      sessionToken,
      ipAddress: ip,
      userAgent,
    });

    const responseTime = Date.now() - startTime;
    console.log(`[BACKOFFICE-LOGIN] Successful login for ${email} in ${responseTime}ms`);

    const response: LoginResponse = {
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        isAdmin: adminUser.isAdmin,
      },
      message: 'Login realizado com sucesso',
    };

    // Criar resposta com cookie de sessão
    const nextResponse = NextResponse.json(response);
    
    // Definir cookie seguro para sessão
    nextResponse.cookies.set('backoffice-auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Mudando de 'strict' para 'lax' para permitir redirects
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/', // Mudando para root path para garantir que seja acessível
    });

    return nextResponse;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[BACKOFFICE-LOGIN] Error after ${responseTime}ms:`, error);
    
    logAuditEvent({
      eventType: 'LOGIN_ATTEMPT',
      userId: 'unknown',
      action: 'BACKOFFICE_LOGIN',
      reason: 'Server error during login',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      ipAddress: ip,
      userAgent,
    });
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}