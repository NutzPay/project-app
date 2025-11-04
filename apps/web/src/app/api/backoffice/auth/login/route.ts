import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types/rbac';
import { prisma } from '@/lib/prisma';
import { generateBackofficeToken } from '@/lib/backoffice/auth';
import crypto from 'crypto';

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

// Hash password for comparison
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
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

    // Buscar usuário no banco de dados
    const adminUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

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

    // Verificar se usuário está ativo
    if (adminUser.status !== 'ACTIVE') {
      logAuditEvent({
        eventType: 'LOGIN_ATTEMPT',
        userId: adminUser.id,
        action: 'BACKOFFICE_LOGIN',
        email,
        reason: 'User account not active',
        success: false,
        ipAddress: ip,
        userAgent,
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json(
        { error: 'Conta inativa', code: 'ACCOUNT_INACTIVE' },
        { status: 401 }
      );
    }

    // Verificar senha (hash SHA256)
    const hashedPassword = hashPassword(password);
    if (adminUser.password !== hashedPassword) {
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

    // Gerar token JWT
    const sessionToken = generateBackofficeToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });

    // Atualizar último login
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip
      }
    });

    // Log de auditoria para login bem-sucedido
    logAuditEvent({
      eventType: 'LOGIN_ATTEMPT',
      userId: adminUser.id,
      action: 'BACKOFFICE_LOGIN',
      email,
      name: adminUser.name,
      role: adminUser.role,
      success: true,
      sessionToken: 'JWT_TOKEN_GENERATED',
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
        role: adminUser.role as UserRole,
        isAdmin: ['SUPER_ADMIN', 'ADMIN', 'OWNER'].includes(adminUser.role),
      },
      message: 'Login realizado com sucesso',
    };

    // Criar resposta com cookie de sessão
    const nextResponse = NextResponse.json(response);

    // Definir cookie seguro para sessão
    nextResponse.cookies.set('backoffice-auth-token', sessionToken, {
      httpOnly: true,
      secure: true, // HTTPS habilitado
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 horas
      path: '/',
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