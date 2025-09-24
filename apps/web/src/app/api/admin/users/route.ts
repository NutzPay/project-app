import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const currentAdmin = await getCurrentAdmin(request);
    
    if (!currentAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: [
        { status: 'asc' }, // Pending first
        { createdAt: 'desc' }
      ]
    });

    console.log(`✅ Found ${users.length} users for admin`);

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        accountType: user.accountType,
        companyName: user.companyName,
        document: user.document,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        // Remove sensitive data
        password: undefined
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
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