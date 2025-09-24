import { NextRequest, NextResponse } from 'next/server';

// Simple audit logging for development
function logAuditEvent(event: any) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp}:`, JSON.stringify(event, null, 2));
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // Obter token da sessão
    const token = request.cookies.get('backoffice-auth-token')?.value;
    
    if (token) {
      // Extrair ID do usuário do token (simplificado para desenvolvimento)
      const userId = token.includes('admin-1') ? 'admin-1' : 
                    token.includes('admin-2') ? 'admin-2' : 
                    token.includes('admin-3') ? 'admin-3' : 'unknown';

      // Log de auditoria para logout
      logAuditEvent({
        eventType: 'LOGOUT',
        userId,
        action: 'BACKOFFICE_LOGOUT',
        sessionToken: token,
        success: true,
        ipAddress: ip,
        userAgent,
      });
    }

    const responseTime = Date.now() - startTime;
    console.log(`[BACKOFFICE-LOGOUT] Logout completed in ${responseTime}ms`);

    // Criar resposta e remover cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

    // Remover cookie de sessão
    response.cookies.delete('backoffice-auth-token');

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[BACKOFFICE-LOGOUT] Error after ${responseTime}ms:`, error);
    
    return NextResponse.json(
      { error: 'Erro durante logout', code: 'LOGOUT_ERROR' },
      { status: 500 }
    );
  }
}