import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { prisma } from './prisma';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OWNER' | 'MEMBER';
  accountType?: 'PF' | 'PJ';
  companyName?: string;
  status?: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      console.log('🔍 No auth token found');
      return null;
    }

    // Verify JWT token
    const decoded = verify(token, process.env.JWT_SECRET || 'temp-secret-key-for-dev') as any;
    
    if (!decoded.userId) {
      console.log('🔍 Invalid token format');
      return null;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('🔍 User not found in database:', decoded.userId);
      return null;
    }

    const authUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      accountType: user.accountType as any,
      companyName: user.companyName || undefined,
      status: user.status as any
    };

    console.log('✅ User authenticated from database:', {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role
    });

    return authUser;

  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

// Helper para verificar se usuário está autenticado
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  return user;
}

// Helper para verificar se usuário é admin
export async function getCurrentAdmin(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('Acesso negado - privilégios de administrador necessários');
  }

  return user;
}

// New verifyAuth function that returns an object with success and user
export async function verifyAuth(request: NextRequest): Promise<{success: boolean, user?: User, error?: string}> {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return { success: false, error: 'Authentication required' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('❌ Error verifying auth:', error);
    return { success: false, error: 'Authentication failed' };
  }
}