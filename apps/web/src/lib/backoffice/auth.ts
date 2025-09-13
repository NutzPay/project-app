import { NextRequest } from 'next/server';
import { verify, sign } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { 
  BACKOFFICE_JWT_SECRET, 
  BACKOFFICE_SESSION_CONFIG,
  isEmailWhitelisted 
} from './config';

const prisma = new PrismaClient();

export interface BackofficeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  sessionType: 'BACKOFFICE';
}

// ============================================
// AUTENTICAÇÃO BACKOFFICE - TOTALMENTE ISOLADA
// ============================================

export async function getCurrentBackofficeUser(request: NextRequest): Promise<BackofficeUser | null> {
  try {
    // Buscar cookie específico do backoffice
    const token = request.cookies.get(BACKOFFICE_SESSION_CONFIG.cookieName)?.value;
    
    if (!token) {
      console.log('🏗️ BACKOFFICE: No auth token found');
      return null;
    }

    // Verificar JWT com secret do backoffice
    const decoded = verify(token, BACKOFFICE_JWT_SECRET) as any;
    
    if (!decoded.userId || decoded.sessionType !== 'BACKOFFICE') {
      console.log('🏗️ BACKOFFICE: Invalid token format or session type');
      return null;
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      console.log('🏗️ BACKOFFICE: User not found in database');
      return null;
    }

    if (user.status !== 'ACTIVE') {
      console.log('🏗️ BACKOFFICE: User account not active:', user.status);
      return null;
    }

    // Verificar whitelist
    if (!isEmailWhitelisted(user.email)) {
      console.log('🏗️ BACKOFFICE: User not in whitelist:', user.email);
      return null;
    }

    console.log('✅ BACKOFFICE: User authenticated:', {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionType: 'BACKOFFICE'
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionType: 'BACKOFFICE'
    };

  } catch (error) {
    console.error('❌ BACKOFFICE: Error getting current user:', error);
    return null;
  }
}

// Helper para verificar autenticação obrigatória
export async function requireBackofficeAuth(request: NextRequest): Promise<BackofficeUser> {
  const user = await getCurrentBackofficeUser(request);
  
  if (!user) {
    throw new Error('Backoffice authentication required');
  }
  
  return user;
}

// Gerar token JWT para backoffice
export function generateBackofficeToken(user: { id: string; email: string; role: string }): string {
  return sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      sessionType: 'BACKOFFICE',
      iat: Math.floor(Date.now() / 1000)
    }, 
    BACKOFFICE_JWT_SECRET, 
    { 
      expiresIn: '8h' // Sessão de 8 horas
    }
  );
}

// Verificar se usuário pode acessar backoffice
export async function canAccessBackoffice(email: string): Promise<boolean> {
  try {
    // Verificar whitelist
    if (!isEmailWhitelisted(email)) {
      return false;
    }

    // Verificar se usuário existe e está ativo
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.status !== 'ACTIVE') {
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ BACKOFFICE: Error checking access:', error);
    return false;
  }
}