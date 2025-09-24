import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        email: true,
        document: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const keys = [];

    if (user.email) {
      keys.push({
        id: `email_${currentUser.id}`,
        type: 'email' as const,
        key: user.email,
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    if (user.document) {
      keys.push({
        id: `document_${currentUser.id}`,
        type: 'cpf' as const,
        key: user.document,
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    keys.push({
      id: `random_${currentUser.id}`,
      type: 'random' as const,
      key: '7d9f8a2e-4c3b-4a8f-9e7d-2a1b3c4d5e6f',
      isActive: false,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    return NextResponse.json({
      success: true,
      keys
    });

  } catch (error) {
    console.error('❌ Error loading PIX keys:', error);
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