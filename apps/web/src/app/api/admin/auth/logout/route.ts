import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { Client } from 'pg';

export async function POST(request: NextRequest) {
  try {
    // Get admin token
    const adminToken = request.cookies.get('admin-auth-token')?.value;
    
    if (adminToken) {
      try {
        // Decode token para log de auditoria
        const decoded = verify(adminToken, process.env.ADMIN_JWT_SECRET || 'admin-secret-key-ultra-secure-different-from-user') as any;
        
        console.log('✅ ADMIN logged out:', {
          email: decoded.email,
          role: decoded.role,
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        });

        // Log audit trail para logout admin
        try {
          const auditClient = new Client({
            connectionString: process.env.DATABASE_URL || "postgresql://nutzbeta:password@localhost:5432/nutzbeta"
          });
          await auditClient.connect();
          
          await auditClient.query(
            'INSERT INTO audit_logs (user_id, action, resource, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
            [
              decoded.userId,
              'ADMIN_LOGOUT',
              'ADMIN_PANEL',
              JSON.stringify({ email: decoded.email, role: decoded.role }),
              request.headers.get('x-forwarded-for') || 'unknown',
              request.headers.get('user-agent') || 'unknown'
            ]
          );
          
          await auditClient.end();
        } catch (auditError) {
          console.error('❌ Failed to log admin logout audit:', auditError);
        }
        
      } catch (tokenError) {
        console.error('❌ Invalid admin token during logout:', tokenError);
      }
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Sessão administrativa encerrada'
    });

    // Clear admin cookie
    response.cookies.set('admin-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin-panel'
    });

    return response;

  } catch (error) {
    console.error('❌ Error during admin logout:', error);
    
    // Mesmo com erro, limpa o cookie
    const response = NextResponse.json({
      success: true,
      message: 'Sessão administrativa encerrada'
    });

    response.cookies.set('admin-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/admin-panel'
    });

    return response;
  }
}