import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const keyId = params.id;
    console.log('🗑️ Revoking API key:', { userId: currentUser.id, keyId });

    // Forward request to backend API
    const backendResponse = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.id}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Erro ao revogar chave API',
          code: 'BACKEND_ERROR'
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully'
    });

  } catch (error) {
    console.error('❌ Error revoking API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const keyId = params.id;
    const body = await request.json();
    console.log('🔄 Updating API key:', { userId: currentUser.id, keyId, action: body.action });

    // Forward request to backend API
    const backendResponse = await fetch(`${API_BASE_URL}/api-keys/${keyId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${currentUser.id}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Erro ao atualizar chave API',
          code: 'BACKEND_ERROR'
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      success: true,
      key: data.data || data,
      message: body.action === 'rotate' ? 'API key rotated successfully' : 'API key updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating API key:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}