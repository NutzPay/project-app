import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { auditService } from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity, AuditCategory } from '@prisma/client';

interface ProfileUpdateRequest {
  name?: string;
  email?: string;
  document?: string;
  accountType?: string;
  companyName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const sellerId = params.id;
    const body: ProfileUpdateRequest = await request.json();

    console.log(`📝 Updating profile for seller ${sellerId}:`, body);

    // Get current admin user for audit
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !['ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores podem editar perfis de sellers.' },
        { status: 403 }
      );
    }

    // Get current seller data for audit comparison
    const currentSeller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        accountType: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
      },
    });

    if (!currentSeller) {
      return NextResponse.json(
        { success: false, error: 'Seller não encontrado' },
        { status: 404 }
      );
    }

    // Validate input and track changes for audit
    const updateData: any = {};
    const changes: Array<{field: string, oldValue: any, newValue: any}> = [];

    // Basic validations
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Nome é obrigatório' },
          { status: 400 }
        );
      }
      if (currentSeller.name !== body.name) {
        changes.push({
          field: 'Nome',
          oldValue: currentSeller.name || 'Não definido',
          newValue: body.name
        });
      }
      updateData.name = body.name.trim();
    }

    if (body.email !== undefined) {
      if (!body.email.trim()) {
        return NextResponse.json(
          { success: false, error: 'Email é obrigatório' },
          { status: 400 }
        );
      }

      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { success: false, error: 'Email inválido' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another user
      if (currentSeller.email !== body.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: body.email,
            id: { not: sellerId }
          }
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, error: 'Este email já está sendo usado por outro usuário' },
            { status: 400 }
          );
        }

        changes.push({
          field: 'Email',
          oldValue: currentSeller.email || 'Não definido',
          newValue: body.email
        });
      }
      updateData.email = body.email.toLowerCase().trim();
    }

    if (body.document !== undefined && body.document.trim()) {
      const cleanDocument = body.document.replace(/\D/g, '');
      if (cleanDocument.length !== 11 && cleanDocument.length !== 14) {
        return NextResponse.json(
          { success: false, error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' },
          { status: 400 }
        );
      }

      if (currentSeller.document !== cleanDocument) {
        changes.push({
          field: 'Documento',
          oldValue: currentSeller.document || 'Não definido',
          newValue: cleanDocument
        });
      }
      updateData.document = cleanDocument;
    }

    if (body.accountType !== undefined) {
      if (!['INDIVIDUAL', 'BUSINESS'].includes(body.accountType)) {
        return NextResponse.json(
          { success: false, error: 'Tipo de conta inválido' },
          { status: 400 }
        );
      }

      if (currentSeller.accountType !== body.accountType) {
        changes.push({
          field: 'Tipo de Conta',
          oldValue: currentSeller.accountType === 'INDIVIDUAL' ? 'Pessoa Física' : 'Pessoa Jurídica',
          newValue: body.accountType === 'INDIVIDUAL' ? 'Pessoa Física' : 'Pessoa Jurídica'
        });
      }
      updateData.accountType = body.accountType;
    }

    // Optional fields - track changes if provided
    const optionalFields = [
      { key: 'companyName', label: 'Nome da Empresa' },
      { key: 'phone', label: 'Telefone' },
      { key: 'address', label: 'Endereço' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'zipCode', label: 'CEP' }
    ];

    for (const { key, label } of optionalFields) {
      if (body[key as keyof ProfileUpdateRequest] !== undefined) {
        const newValue = (body[key as keyof ProfileUpdateRequest] as string)?.trim() || null;
        const oldValue = (currentSeller as any)[key] || null;

        if (oldValue !== newValue) {
          changes.push({
            field: label,
            oldValue: oldValue || 'Não definido',
            newValue: newValue || 'Removido'
          });
        }
        updateData[key] = newValue;
      }
    }

    // If no changes, return early
    if (changes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma alteração detectada'
      });
    }

    // Update seller in database
    const updatedSeller = await prisma.user.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        document: true,
        accountType: true,
        companyName: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        updatedAt: true,
      },
    });

    // Log audit event for profile changes
    try {
      await auditService.logEvent({
        action: AuditAction.USER_PROFILE_UPDATE,
        category: AuditCategory.ADMINISTRATIVE,
        severity: AuditSeverity.HIGH,
        description: `Perfil do seller alterado: ${currentSeller.name} (${currentSeller.email})`,
        success: true,
        userId: currentUser.id,
        ipAddress,
        userAgent,
        resource: 'seller_profile',
        resourceId: sellerId,
        details: {
          sellerName: currentSeller.name,
          sellerEmail: currentSeller.email,
          changesCount: changes.length,
          changes: changes.map(change => ({
            field: change.field,
            oldValue: change.oldValue,
            newValue: change.newValue
          })),
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          timestamp: new Date().toISOString()
        }
      });
    } catch (auditError) {
      console.error('Failed to log seller profile update audit:', auditError);
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Seller profile updated: ${sellerId} in ${responseTime}ms`);

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      seller: updatedSeller
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error updating seller profile after ${responseTime}ms:`, error);

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { success: false, error: 'Seller não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}