#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TIMEOUT_MINUTES = 15;

async function checkAndUpdateTimeouts() {
  console.log('🕒 Iniciando verificação de timeouts de transações...');
  console.log(`⏰ Timeout configurado: ${TIMEOUT_MINUTES} minutos`);

  try {
    const timeoutDate = new Date(Date.now() - (TIMEOUT_MINUTES * 60 * 1000));
    console.log(`📅 Data limite: ${timeoutDate.toISOString()}`);

    let totalFound = 0;
    let totalUpdated = 0;

    // Verificar transações USDT
    try {
      console.log('\n💱 Verificando transações USDT...');

      const expiredUSDT = await prisma.$queryRaw`
        SELECT id, type, status, amount, "createdAt"
        FROM usdt_transactions
        WHERE status IN ('PENDING', 'PROCESSING')
        AND "createdAt" < ${timeoutDate}
        LIMIT 50;
      `;

      console.log(`   Encontradas: ${expiredUSDT.length} transações USDT expiradas`);
      totalFound += expiredUSDT.length;

      if (expiredUSDT.length > 0) {
        for (const tx of expiredUSDT) {
          try {
            await prisma.$executeRaw`
              UPDATE usdt_transactions
              SET status = 'FAILED',
                  description = ${`Transação expirada por timeout (${TIMEOUT_MINUTES} minutos)`},
                  "processedAt" = ${new Date()},
                  "updatedAt" = ${new Date()}
              WHERE id = ${tx.id};
            `;

            console.log(`   ✅ ${tx.id} - ${tx.type} - ${tx.amount} USDT`);
            totalUpdated++;
          } catch (updateError) {
            console.error(`   ❌ Erro ao atualizar ${tx.id}:`, updateError.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar USDT:', error.message);
    }

    // Verificar transações PIX
    try {
      console.log('\n💰 Verificando transações PIX...');

      const expiredPIX = await prisma.$queryRaw`
        SELECT id, type, status, amount, "createdAt"
        FROM pix_transactions
        WHERE status IN ('PENDING', 'PROCESSING')
        AND "createdAt" < ${timeoutDate}
        LIMIT 50;
      `;

      console.log(`   Encontradas: ${expiredPIX.length} transações PIX expiradas`);
      totalFound += expiredPIX.length;

      if (expiredPIX.length > 0) {
        for (const tx of expiredPIX) {
          try {
            await prisma.$executeRaw`
              UPDATE pix_transactions
              SET status = 'FAILED',
                  description = ${`Transação PIX expirada por timeout (${TIMEOUT_MINUTES} minutos)`},
                  "processedAt" = ${new Date()},
                  "updatedAt" = ${new Date()}
              WHERE id = ${tx.id};
            `;

            console.log(`   ✅ ${tx.id} - ${tx.type} - R$ ${tx.amount}`);
            totalUpdated++;
          } catch (updateError) {
            console.error(`   ❌ Erro ao atualizar ${tx.id}:`, updateError.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar PIX:', error.message);
    }

    // Verificar estatísticas atuais
    try {
      console.log('\n📊 Estatísticas atuais...');

      const [pendingUSDT, pendingPIX] = await Promise.all([
        prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM usdt_transactions
          WHERE status IN ('PENDING', 'PROCESSING');
        `,
        prisma.$queryRaw`
          SELECT COUNT(*) as count
          FROM pix_transactions
          WHERE status IN ('PENDING', 'PROCESSING');
        `
      ]);

      console.log(`   Transações USDT pendentes: ${pendingUSDT[0]?.count || 0}`);
      console.log(`   Transações PIX pendentes: ${pendingPIX[0]?.count || 0}`);
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error.message);
    }

    console.log(`\n🎯 Resumo da execução:
      ⏰ Timeout: ${TIMEOUT_MINUTES} minutos
      🔍 Encontradas: ${totalFound} transações expiradas
      ✅ Atualizadas: ${totalUpdated} transações
      🕐 Executado em: ${new Date().toLocaleString('pt-BR')}
    `);

    return {
      found: totalFound,
      updated: totalUpdated,
      timeoutMinutes: TIMEOUT_MINUTES
    };

  } catch (error) {
    console.error('❌ Erro geral:', error);
    throw error;
  }
}

// Função para criar transação de teste (desenvolvimento apenas)
async function createTestTransaction() {
  console.log('🧪 Criando transação de teste...');

  try {
    // Criar transação USDT de 16 minutos atrás
    const testDate = new Date(Date.now() - (16 * 60 * 1000));

    const result = await prisma.$queryRaw`
      INSERT INTO usdt_transactions (id, "walletId", type, status, amount, description, "createdAt", "updatedAt")
      VALUES ('test_timeout_tx', 'test_wallet', 'DEPOSIT', 'PENDING', 100, 'Transação de teste para timeout', ${testDate}, ${testDate})
      ON CONFLICT (id) DO NOTHING
      RETURNING id;
    `;

    console.log('✅ Transação de teste criada:', result);
  } catch (error) {
    console.error('❌ Erro ao criar transação de teste:', error.message);
  }
}

// Executar baseado nos argumentos
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    createTestTransaction()
      .then(() => prisma.$disconnect())
      .catch(console.error);
  } else {
    checkAndUpdateTimeouts()
      .then(() => prisma.$disconnect())
      .catch(console.error);
  }
}

module.exports = { checkAndUpdateTimeouts, createTestTransaction };