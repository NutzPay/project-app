import { UserRole, UserType, ConflictingUser } from '@/types/rbac';
import { ADMIN_ROLES, SELLER_ROLES, validateRoleConflict } from './permissions';
import { auditService } from './audit';

interface DatabaseUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  userType?: UserType;
  companyId?: string;
  status: string;
  isAdmin?: boolean;
  isSeller?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class ConflictDetector {
  async detectConflictingUsers(): Promise<ConflictingUser[]> {
    const conflicts: ConflictingUser[] = [];
    
    // Em produção, buscar do banco de dados
    // const users = await prisma.user.findMany();
    
    // Mock data para demonstração
    const mockUsers: DatabaseUser[] = [
      {
        id: 'user-1',
        email: 'admin@nutz.com',
        name: 'Admin User',
        role: UserRole.SUPER_ADMIN,
        userType: UserType.ADMIN_INTERNAL,
        status: 'ACTIVE',
        isAdmin: true,
        isSeller: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'seller@company.com',
        name: 'Seller User',
        role: UserRole.SELLER,
        userType: UserType.SELLER_EXTERNAL,
        companyId: 'company-1',
        status: 'ACTIVE',
        isAdmin: false,
        isSeller: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Usuário conflitante para demonstração
      {
        id: 'user-conflict-1',
        email: 'conflict@example.com',
        name: 'Conflicted User',
        role: UserRole.ADMIN, // Role de admin
        userType: UserType.SELLER_EXTERNAL, // Mas tipo seller
        companyId: 'company-2',
        status: 'ACTIVE',
        isAdmin: true,
        isSeller: true, // Conflito: é admin E seller
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const user of mockUsers) {
      const userConflicts = this.checkUserConflicts(user);
      if (userConflicts.length > 0) {
        const conflictingUser: ConflictingUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: [user.role],
          userTypes: user.userType ? [user.userType] : [],
          companyId: user.companyId,
          status: user.status,
          conflictReason: userConflicts.join('; '),
          detectedAt: new Date(),
        };
        conflicts.push(conflictingUser);

        // Log do conflito
        await auditService.logEvent({
          eventType: 'ROLE_CONFLICT',
          userId: user.id,
          details: {
            email: user.email,
            role: user.role,
            userType: user.userType,
            conflicts: userConflicts,
            isAdmin: user.isAdmin,
            isSeller: user.isSeller,
          },
          ipAddress: 'system',
          userAgent: 'conflict-detector',
        });
      }
    }

    return conflicts;
  }

  private checkUserConflicts(user: DatabaseUser): string[] {
    const conflicts: string[] = [];

    // Verificar se tem flags conflitantes
    if (user.isAdmin && user.isSeller) {
      conflicts.push('User has both isAdmin=true and isSeller=true flags');
    }

    // Verificar role vs userType
    const isAdminRole = ADMIN_ROLES.includes(user.role);
    const isSellerRole = SELLER_ROLES.includes(user.role);

    if (isAdminRole && user.userType === UserType.SELLER_EXTERNAL) {
      conflicts.push(`Admin role ${user.role} with SELLER_EXTERNAL user type`);
    }

    if (isSellerRole && user.userType === UserType.ADMIN_INTERNAL) {
      conflicts.push(`Seller role ${user.role} with ADMIN_INTERNAL user type`);
    }

    // Verificar role vs flags
    if (isAdminRole && user.isSeller) {
      conflicts.push(`Admin role ${user.role} but isSeller=true`);
    }

    if (isSellerRole && user.isAdmin) {
      conflicts.push(`Seller role ${user.role} but isAdmin=true`);
    }

    // Verificar companyId para sellers
    if (isSellerRole && !user.companyId) {
      conflicts.push(`Seller role ${user.role} without companyId`);
    }

    if (isAdminRole && user.companyId) {
      // Admins não deveriam ter companyId específico (exceto multi-tenant específico)
      conflicts.push(`Admin role ${user.role} with specific companyId`);
    }

    return conflicts;
  }

  async generateConflictReport(): Promise<string> {
    const conflicts = await this.detectConflictingUsers();
    
    if (conflicts.length === 0) {
      return 'ID,Email,Name,Roles,UserTypes,CompanyId,Status,ConflictReason,DetectedAt\n# No conflicting users found';
    }

    const headers = [
      'ID',
      'Email', 
      'Name',
      'Roles',
      'UserTypes',
      'CompanyId',
      'Status',
      'ConflictReason',
      'DetectedAt'
    ].join(',');

    const rows = conflicts.map(conflict => [
      conflict.id,
      conflict.email,
      conflict.name || '',
      conflict.roles.join('|'),
      conflict.userTypes.join('|'),
      conflict.companyId || '',
      conflict.status,
      `"${conflict.conflictReason}"`,
      conflict.detectedAt.toISOString()
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  async saveConflictReport(): Promise<string> {
    const csvContent = await this.generateConflictReport();
    const filename = `usuarios_conflitantes_${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = `reports/${filename}`;

    try {
      // Em produção, salvar no sistema de arquivos ou cloud storage
      console.log(`[CONFLICT-DETECTOR] Would save report to: ${filepath}`);
      console.log('CSV Content:', csvContent);
      
      // Para desenvolvimento, salvar em variável global para download via API
      if (typeof globalThis !== 'undefined') {
        (globalThis as any).__conflictReport = {
          filename,
          content: csvContent,
          generatedAt: new Date(),
        };
      }

      return filepath;
    } catch (error) {
      console.error('Failed to save conflict report:', error);
      throw new Error('Failed to save conflict report');
    }
  }

  async resolveUserConflict(userId: string, resolution: 'make_admin' | 'make_seller' | 'suspend'): Promise<void> {
    // Em produção, atualizar no banco de dados
    console.log(`[CONFLICT-DETECTOR] Would resolve conflict for user ${userId} with resolution: ${resolution}`);

    // Log da resolução
    await auditService.logEvent({
      eventType: 'ROLE_CONFLICT',
      userId,
      details: {
        action: 'conflict_resolved',
        resolution,
        resolvedBy: 'admin',
        resolvedAt: new Date(),
      },
      ipAddress: 'system',
      userAgent: 'conflict-resolver',
    });

    // Implementar lógica de resolução
    switch (resolution) {
      case 'make_admin':
        // Converter para admin
        console.log(`Converting user ${userId} to admin-only`);
        break;
      case 'make_seller':
        // Converter para seller
        console.log(`Converting user ${userId} to seller-only`);
        break;
      case 'suspend':
        // Suspender conta
        console.log(`Suspending user ${userId} due to conflict`);
        break;
    }
  }

  async runConflictCheck(): Promise<{ 
    conflictCount: number; 
    reportPath: string | null; 
    conflicts: ConflictingUser[] 
  }> {
    const conflicts = await this.detectConflictingUsers();
    let reportPath = null;

    if (conflicts.length > 0) {
      reportPath = await this.saveConflictReport();
      console.log(`[CONFLICT-DETECTOR] Found ${conflicts.length} conflicting users. Report saved to: ${reportPath}`);
    } else {
      console.log('[CONFLICT-DETECTOR] No conflicting users found');
    }

    return {
      conflictCount: conflicts.length,
      reportPath,
      conflicts,
    };
  }
}

export const conflictDetector = new ConflictDetector();

// Auto-executar verificação de conflitos na inicialização (apenas no servidor)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Executar uma vez na inicialização
  setTimeout(async () => {
    try {
      await conflictDetector.runConflictCheck();
    } catch (error) {
      console.error('[CONFLICT-DETECTOR] Initial conflict check failed:', error);
    }
  }, 5000); // 5 segundos após inicialização

  // Executar verificação diária
  setInterval(async () => {
    try {
      await conflictDetector.runConflictCheck();
    } catch (error) {
      console.error('[CONFLICT-DETECTOR] Scheduled conflict check failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 horas
}