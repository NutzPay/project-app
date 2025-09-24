import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email e senha são obrigatórios'
        },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        usdtWallet: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não encontrado'
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Senha inválida'
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'temp-secret-key-for-dev',
      { expiresIn: '24h' }
    );

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    console.log('✅ User logged in:', {
      id: user.id,
      email: user.email,
      role: user.role
    });

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}