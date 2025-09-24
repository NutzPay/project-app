import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    const currentAdmin = await getCurrentAdmin(request);
    
    if (!currentAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Acesso negado. Apenas administradores podem rejeitar usuários.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const { reason } = await request.json();
    const userId = params.id;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Motivo da rejeição é obrigatório',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
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

    if (user.status !== 'PENDING') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não está pendente de aprovação',
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Update user status to REJECTED
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED', // Using SUSPENDED as rejection status
        updatedAt: new Date(),
        // Store rejection reason in a notes field if it exists, or you can add it to the schema
      }
    });

    console.log('✅ User rejected:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      status: updatedUser.status,
      reason: reason
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário rejeitado.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        status: updatedUser.status,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('❌ Error rejecting user:', error);
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