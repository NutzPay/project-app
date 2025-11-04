import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
// import { getDigitoPayService } from '@/lib/digitopay'; // Temporariamente desabilitado
import { getXGateService } from '@/lib/xgate';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser || !['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const acquirerId = params.id;
    
    const acquirer = await prisma.paymentAcquirer.findUnique({
      where: { id: acquirerId }
    });

    if (!acquirer) {
      return NextResponse.json(
        { success: false, error: 'Adquirente não encontrado' },
        { status: 404 }
      );
    }

    let testResult = {
      success: false,
      message: '',
      details: null as any
    };

    try {
      // Parse API configuration
      const apiConfig = acquirer.apiConfig ? JSON.parse(acquirer.apiConfig) : {};

      // Test based on acquirer slug
      switch (acquirer.slug) {
        case 'digitopay':
          // Temporariamente desabilitado
          testResult = {
            success: false,
            message: 'DigitoPay temporariamente desabilitado',
            details: { configured: false }
          };
          break;

        case 'xgate':
          try {
            const xgateService = getXGateService();
            await xgateService.loadCurrenciesAndCryptos();
            
            testResult = {
              success: true,
              message: 'XGate conectado com sucesso',
              details: {
                configured: true,
                testMode: acquirer.testMode,
                supportsDeposits: acquirer.supportsDeposits,
                supportsWebhooks: acquirer.supportsWebhooks
              }
            };
          } catch (error) {
            testResult = {
              success: false,
              message: 'Falha na conexão com XGate',
              details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
          }
          break;

        case 'starkbank':
          // TODO: Implement StarkBank connection test
          const starkbankConfig = await prisma.starkbankConfig.findFirst({
            where: { isActive: true }
          });
          
          if (starkbankConfig) {
            testResult = {
              success: true,
              message: 'StarkBank configurado',
              details: {
                configured: true,
                environment: starkbankConfig.environment,
                testMode: acquirer.testMode
              }
            };
          } else {
            testResult = {
              success: false,
              message: 'StarkBank não configurado',
              details: { configured: false }
            };
          }
          break;

        default:
          testResult = {
            success: false,
            message: `Teste não implementado para ${acquirer.name}`,
            details: { slug: acquirer.slug }
          };
      }

      // Update acquirer with test results
      await prisma.paymentAcquirer.update({
        where: { id: acquirerId },
        data: {
          lastTestAt: testResult.success ? new Date() : undefined,
          lastErrorAt: !testResult.success ? new Date() : undefined,
          lastErrorMessage: !testResult.success ? testResult.message : null,
          status: testResult.success ? 'ACTIVE' : 'ERROR'
        }
      });

    } catch (error) {
      console.error('❌ Acquirer test error:', error);
      testResult = {
        success: false,
        message: 'Erro durante o teste de conexão',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };

      // Update acquirer with error
      await prisma.paymentAcquirer.update({
        where: { id: acquirerId },
        data: {
          lastErrorAt: new Date(),
          lastErrorMessage: testResult.message,
          status: 'ERROR'
        }
      });
    }

    console.log(`🧪 Acquirer test result for ${acquirer.slug}:`, testResult.success ? 'SUCCESS' : 'FAILED');

    return NextResponse.json({
      success: true,
      testResult
    });

  } catch (error) {
    console.error('❌ Error testing acquirer:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}