import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
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

    console.log('✅ User authenticated for API keys:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role
    });

    // Forward request to backend API
    const backendResponse = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.id}`, // Use user ID as auth token for now
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        // No API keys found - return empty array
        return NextResponse.json({
          success: true,
          keys: [],
          message: 'No API keys found'
        });
      }

      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Erro ao buscar chaves API',
          code: 'BACKEND_ERROR'
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      success: true,
      keys: data.data || data || [],
      message: 'API keys retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching API keys:', error);
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

export async function POST(request: NextRequest) {
  try {
    // Get current authenticated user
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

    const body = await request.json();
    console.log('🔑 Creating new API key:', { userId: currentUser.id, ...body });

    // Forward request to backend API
    const backendResponse = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentUser.id}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...body,
        userId: currentUser.id,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Erro ao criar chave API',
          code: 'BACKEND_ERROR'
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();

    return NextResponse.json({
      success: true,
      key: data.data || data,
      message: 'API key created successfully'
    });

  } catch (error) {
    console.error('❌ Error creating API key:', error);
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