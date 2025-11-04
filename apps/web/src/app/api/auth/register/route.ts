import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, accountType, companyName, document } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !accountType || !document) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Todos os campos são obrigatórios',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (accountType === 'PJ' && !companyName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Nome da empresa é obrigatório para pessoa jurídica',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email já está em uso',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MEMBER',
        status: 'ACTIVE', // TODO: Change back to PENDING when approval flow is fixed
        accountType: accountType as 'PF' | 'PJ',
        companyName: accountType === 'PJ' ? companyName : undefined,
        document: document.replace(/\D/g, ''), // Remove formatting
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      accountType: user.accountType,
      status: user.status
    });

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Você já pode fazer login.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status
      }
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
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