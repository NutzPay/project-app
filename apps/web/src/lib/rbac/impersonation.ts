import { ImpersonationSession } from '@/types/rbac';
import { auditService } from './audit';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

class ImpersonationService {
  private sessions: Map<string, ImpersonationSession> = new Map();

  async startImpersonation(
    adminUserId: string,
    sellerUserId: string,
    sellerEmail: string,
    ipAddress: string,
    userAgent: string
  ): Promise<{ sessionToken: string; dashboardUrl: string }> {
    // Verificar se já existe sessão ativa para este seller
    const existingSession = Array.from(this.sessions.values())
      .find(session => 
        session.sellerUserId === sellerUserId && 
        session.isActive && 
        session.expiresAt > new Date()
      );

    if (existingSession) {
      throw new Error('Seller already has an active impersonation session');
    }

    // Criar nova sessão
    const sessionId = randomUUID();
    const sessionToken = this.generateImpersonationToken(adminUserId, sellerUserId, sessionId);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 horas de duração

    const session: ImpersonationSession = {
      id: sessionId,
      adminUserId,
      sellerUserId,
      sellerEmail,
      sessionToken,
      startedAt: new Date(),
      expiresAt,
      isActive: true,
    };

    this.sessions.set(sessionId, session);

    // Log de auditoria
    await auditService.logImpersonationStart(
      adminUserId,
      sellerUserId,
      sellerEmail,
      sessionToken,
      ipAddress,
      userAgent
    );

    // URL do dashboard com token de impersonação
    const dashboardUrl = `/dashboard?impersonation=${sessionToken}`;

    return { sessionToken, dashboardUrl };
  }

  async endImpersonation(
    sessionToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const session = this.getSessionByToken(sessionToken);
    
    if (!session) {
      throw new Error('Invalid impersonation session');
    }

    if (!session.isActive) {
      throw new Error('Impersonation session already ended');
    }

    // Marcar sessão como inativa
    session.isActive = false;
    
    // Calcular duração
    const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    // Log de auditoria
    await auditService.logImpersonationEnd(
      session.adminUserId,
      session.sellerUserId,
      session.sellerEmail,
      sessionToken,
      duration,
      ipAddress,
      userAgent
    );

    // Remover sessão após um tempo para permitir logs
    setTimeout(() => {
      this.sessions.delete(session.id);
    }, 5000);
  }

  async validateImpersonationToken(token: string): Promise<ImpersonationSession | null> {
    try {
      const decoded = jwt.verify(token, process.env.IMPERSONATION_JWT_SECRET || 'impersonation-secret') as any;
      const session = this.sessions.get(decoded.sessionId);
      
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      return session;
    } catch (error) {
      return null;
    }
  }

  getActiveImpersonationSessions(adminUserId?: string): ImpersonationSession[] {
    const sessions = Array.from(this.sessions.values())
      .filter(session => session.isActive && session.expiresAt > new Date());

    if (adminUserId) {
      return sessions.filter(session => session.adminUserId === adminUserId);
    }

    return sessions;
  }

  async getImpersonationHistory(
    adminUserId?: string,
    sellerUserId?: string,
    limit: number = 100
  ): Promise<any[]> {
    const filters: any = {};
    if (adminUserId) filters.adminUserId = adminUserId;
    if (sellerUserId) filters.sellerUserId = sellerUserId;

    const events = await auditService.getEvents({
      ...filters,
      eventType: 'IMPERSONATION_START'
    });

    return events.slice(0, limit).map(event => ({
      id: event.id,
      adminUserId: event.adminUserId,
      sellerUserId: event.sellerUserId,
      sellerEmail: event.details.sellerEmail,
      startedAt: event.timestamp,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    }));
  }

  private generateImpersonationToken(
    adminUserId: string,
    sellerUserId: string,
    sessionId: string
  ): string {
    return jwt.sign(
      {
        adminUserId,
        sellerUserId,
        sessionId,
        type: 'impersonation',
      },
      process.env.IMPERSONATION_JWT_SECRET || 'impersonation-secret',
      { expiresIn: '2h' }
    );
  }

  private getSessionByToken(token: string): ImpersonationSession | null {
    try {
      const decoded = jwt.verify(token, process.env.IMPERSONATION_JWT_SECRET || 'impersonation-secret') as any;
      return this.sessions.get(decoded.sessionId) || null;
    } catch (error) {
      return null;
    }
  }

  // Limpeza automática de sessões expiradas
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now || !session.isActive) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[IMPERSONATION] Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  // Forçar encerramento de todas as sessões de um admin
  async forceEndAdminSessions(adminUserId: string): Promise<number> {
    const adminSessions = this.getActiveImpersonationSessions(adminUserId);
    
    for (const session of adminSessions) {
      session.isActive = false;
    }

    console.log(`[IMPERSONATION] Force ended ${adminSessions.length} sessions for admin ${adminUserId}`);
    return adminSessions.length;
  }
}

export const impersonationService = new ImpersonationService();

// Limpeza automática a cada 5 minutos
if (typeof window === 'undefined') {
  setInterval(() => {
    impersonationService.cleanupExpiredSessions();
  }, 5 * 60 * 1000);
}