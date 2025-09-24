import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // This is a temporary endpoint to create an admin user for testing
    // In production, this should be removed or heavily secured

    const adminEmail = 'admin@nutzbeta.local';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role,
          status: existingAdmin.status
        }
      });
    }

    // Hash password
    const hashedPassword = await hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        accountType: 'PF',
        document: '00000000000',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Admin user created successfully:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      status: admin.status
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      admin: {
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status
      },
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
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