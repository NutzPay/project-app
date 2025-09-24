import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/backoffice/user-acquirers?userId=xxx - Get user's assigned acquirers
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Get user's assigned acquirers
    const userAcquirers = await prisma.userAcquirer.findMany({
      where: { userId },
      include: {
        acquirer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        priority: 'desc'
      }
    });

    // Get available acquirers (active ones not assigned to this user)
    const assignedAcquirerIds = userAcquirers.map(ua => ua.acquirerId);
    const availableAcquirers = await prisma.paymentAcquirer.findMany({
      where: {
        status: 'ACTIVE',
        NOT: {
          id: {
            in: assignedAcquirerIds
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      userAcquirers,
      availableAcquirers
    });

  } catch (error) {
    console.error('❌ Error fetching user acquirers:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/backoffice/user-acquirers - Assign acquirer to user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const {
      userId,
      acquirerId,
      priority,
      dailyLimit,
      monthlyLimit,
      customFeeConfig
    } = await request.json();

    // Validation
    if (!userId || !acquirerId) {
      return NextResponse.json(
        { success: false, error: 'userId e acquirerId são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Check if acquirer exists and is active
    const acquirer = await prisma.paymentAcquirer.findUnique({
      where: { id: acquirerId }
    });

    if (!acquirer) {
      return NextResponse.json(
        { success: false, error: 'Adquirente não encontrado' },
        { status: 404 }
      );
    }

    if (acquirer.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Adquirente deve estar ativo para ser atribuído' },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.userAcquirer.findUnique({
      where: {
        userId_acquirerId: {
          userId,
          acquirerId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Adquirente já está atribuído a este usuário' },
        { status: 400 }
      );
    }

    // Create assignment
    const userAcquirer = await prisma.userAcquirer.create({
      data: {
        userId,
        acquirerId,
        priority: priority || 0,
        dailyLimit: dailyLimit ? parseFloat(dailyLimit.toString()) : null,
        monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit.toString()) : null,
        customFeeConfig: customFeeConfig ? JSON.stringify(customFeeConfig) : null
      },
      include: {
        acquirer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    console.log(`✅ Acquirer ${acquirer.name} assigned to user ${user.name}`);

    return NextResponse.json({
      success: true,
      userAcquirer
    });

  } catch (error) {
    console.error('❌ Error assigning acquirer to user:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}