import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'Usuário não autenticado',
        cookies: request.cookies.toString(),
        authToken: request.cookies.get('auth-token')?.value ? '***exists***' : 'missing'
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      cookies: request.cookies.toString()
    });
  }
}