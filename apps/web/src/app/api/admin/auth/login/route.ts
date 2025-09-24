import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email e senha são obrigatórios',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Connect to database
    const client = new Client({
      connectionString: process.env.DATABASE_URL || "postgresql://nutzbeta:password@localhost:5432/nutzbeta"
    });
    
    await client.connect();
    
    // Find admin user - APENAS SUPER_ADMIN e ADMIN podem fazer login aqui
    const result = await client.query(
      'SELECT id, email, name, password, role, status FROM users WHERE email = $1 AND role IN ($2, $3)',
      [email, 'SUPER_ADMIN', 'ADMIN']
    );
    
    await client.end();
    
    const user = result.rows[0];

    if (!user) {
      console.log(`❌ Admin login attempt failed: ${email} - User not found or insufficient privileges`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Credenciais administrativas inválidas',
          code: 'INVALID_ADMIN_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      console.log(`❌ Admin login attempt failed: ${email} - Invalid password`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Credenciais administrativas inválidas',
          code: 'INVALID_ADMIN_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Check if admin account is active
    if (user.status !== 'ACTIVE') {
      console.log(`❌ Admin login attempt failed: ${email} - Account not active: ${user.status}`);
      return NextResponse.json(
        { 
          success: false,
          error: 'Conta administrativa não está ativa',
          code: 'ADMIN_ACCOUNT_INACTIVE'
        },
        { status: 403 }
      );
    }

    // Generate ADMIN JWT token (different secret)
    const adminToken = sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        type: 'ADMIN_SESSION' // Identificador especial para sessões admin
      },
      process.env.ADMIN_JWT_SECRET || 'admin-secret-key-different-from-user',
      { expiresIn: '8h' } // Sessões admin expiram mais rápido
    );

    console.log('✅ ADMIN logged in successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    });

    // Log audit trail para login admin
    try {
      const auditClient = new Client({
        connectionString: process.env.DATABASE_URL || "postgresql://nutzbeta:password@localhost:5432/nutzbeta"
      });
      await auditClient.connect();
      
      await auditClient.query(
        'INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          user.id,
          'ADMIN_LOGIN',
          'ADMIN_PANEL',
          JSON.stringify({ email: user.email, role: user.role }),
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || 'unknown'
        ]
      );
      
      await auditClient.end();
    } catch (auditError) {
      console.error('❌ Failed to log admin login audit:', auditError);
      // Não falha o login por erro de auditoria, mas loga o problema
    }

    // Create response with admin token as httpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Acesso administrativo concedido',
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set ADMIN JWT token como cookie httpOnly diferente
    response.cookies.set('admin-token', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Mais restritivo para admin
      maxAge: 8 * 60 * 60, // 8 horas
      path: '/admin-panel' // Cookie só vale para rotas administrativas
    });

    return response;

  } catch (error) {
    console.error('❌ Error during admin login:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor administrativo',
        code: 'INTERNAL_ADMIN_ERROR'
      },
      { status: 500 }
    );
  }
}