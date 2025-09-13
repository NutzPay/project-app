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
          error: 'Acesso negado. Apenas administradores podem aprovar usuários.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const { taxes } = await request.json();
    const userId = params.id;

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

    // Update user status to ACTIVE
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });

    // Create USDT wallet for the user
    await prisma.uSDTWallet.upsert({
      where: { userId: userId },
      update: {},
      create: {
        userId: userId,
        balance: 0,
        frozenBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0
      }
    });

    console.log('✅ User approved and wallet created:', {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      status: updatedUser.status
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário aprovado com sucesso!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        status: updatedUser.status,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('❌ Error approving user:', error);
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