#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://nutzbeta:password@localhost:5433/nutzbeta'
    }
  }
});

const TIMEOUT_MINUTES = 15;

async function checkAndUpdateTimeouts() {
  console.log('🕒 Iniciando verificação de timeouts de transações...');

  try {
    const timeoutDate = new Date(Date.now() - (TIMEOUT_MINUTES * 60 * 1000));
    console.log(`📅 Data limite: ${timeoutDate.toISOString()}`);

    // Buscar transações USDT pendentes expiradas
    const expiredUSDTQuery = `
      SELECT id, "walletId", type, status, amount, "createdAt"
      FROM usdt_transactions
      WHERE status IN ('PENDING', 'PROCESSING')
      AND "createdAt" < $1;
    `;

    // Buscar transações PIX pendentes expiradas
    const expiredPIXQuery = `
      SELECT id, "walletId", type, status, amount, "createdAt"
      FROM pix_transactions
      WHERE status IN ('PENDING', 'PROCESSING')
      AND "createdAt" < $1;
    `;

    // Buscar transações de investimento pendentes expiradas
    const expiredInvestmentQuery = `
      SELECT id, "investmentId", type, status, amount, "createdAt"
      FROM investment_transactions
      WHERE status IN ('PENDING', 'PROCESSING')
      AND "createdAt" < $1;
    `;

    console.log('🔍 Buscando transações expiradas...');

    const [expiredUSDT, expiredPIX, expiredInvestment] = await Promise.all([
      prisma.$queryRawUnsafe(expiredUSDTQuery, timeoutDate),
      prisma.$queryRawUnsafe(expiredPIXQuery, timeoutDate),
      prisma.$queryRawUnsafe(expiredInvestmentQuery, timeoutDate)
    ]);

    console.log(`📊 Encontradas:
      - USDT: ${expiredUSDT.length}
      - PIX: ${expiredPIX.length}
      - Investment: ${expiredInvestment.length}`);

    let totalUpdated = 0;

    // Atualizar transações USDT
    if (expiredUSDT.length > 0) {
      console.log('💱 Atualizando transações USDT...');
      for (const tx of expiredUSDT) {
        try {
          await prisma.$queryRaw`
            UPDATE usdt_transactions
            SET status = 'FAILED',
                description = ${`Transação expirada por timeout (${TIMEOUT_MINUTES} minutos)`},
                "processedAt" = ${new Date()},
                "updatedAt" = ${new Date()}
            WHERE id = ${tx.id};
          `;

          console.log(`  ✅ USDT ${tx.id} - ${tx.type} - ${tx.amount} USDT`);
          totalUpdated++;
        } catch (error) {
          console.error(`  ❌ Erro ao atualizar USDT ${tx.id}:`, error.message);
        }
      }
    }

    // Atualizar transações PIX
    if (expiredPIX.length > 0) {
      console.log('💰 Atualizando transações PIX...');
      for (const tx of expiredPIX) {
        try {
          await prisma.$queryRaw`
            UPDATE pix_transactions
            SET status = 'FAILED',
                description = ${`Transação PIX expirada por timeout (${TIMEOUT_MINUTES} minutos)`},
                "processedAt" = ${new Date()},
                "updatedAt" = ${new Date()}
            WHERE id = ${tx.id};
          `;

          console.log(`  ✅ PIX ${tx.id} - ${tx.type} - R$ ${tx.amount}`);
          totalUpdated++;
        } catch (error) {
          console.error(`  ❌ Erro ao atualizar PIX ${tx.id}:`, error.message);
        }
      }
    }

    // Atualizar transações de investimento
    if (expiredInvestment.length > 0) {
      console.log('📈 Atualizando transações de investimento...');
      for (const tx of expiredInvestment) {
        try {
          await prisma.$queryRaw`
            UPDATE investment_transactions
            SET status = 'FAILED',
                notes = ${`Transação de investimento expirada por timeout (${TIMEOUT_MINUTES} minutos)`},
                "processedAt" = ${new Date()},
                "updatedAt" = ${new Date()}
            WHERE id = ${tx.id};
          `;

          console.log(`  ✅ Investment ${tx.id} - ${tx.type} - ${tx.amount}`);
          totalUpdated++;
        } catch (error) {
          console.error(`  ❌ Erro ao atualizar Investment ${tx.id}:`, error.message);
        }
      }
    }

    console.log(`\n🎯 Resumo:
      - Total encontradas: ${expiredUSDT.length + expiredPIX.length + expiredInvestment.length}
      - Total atualizadas: ${totalUpdated}
      - Timeout: ${TIMEOUT_MINUTES} minutos
      - Executado em: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkAndUpdateTimeouts().catch(console.error);
}

module.exports = { checkAndUpdateTimeouts };