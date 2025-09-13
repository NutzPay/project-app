const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function processTransaction(pixTransactionId) {
  try {
    console.log(`🔍 Looking for transaction: ${pixTransactionId}`);
    
    // Buscar a transação
    const transaction = await prisma.uSDTTransaction.findFirst({
      where: {
        OR: [
          { pixTransactionId: pixTransactionId },
          { externalId: pixTransactionId },
          { id: pixTransactionId }
        ]
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      console.error('❌ Transaction not found!');
      console.log('Searching in all recent transactions...');
      
      const recent = await prisma.uSDTTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              user: { select: { name: true, email: true } }
            }
          }
        }
      });
      
      console.log('📋 Recent transactions:');
      recent.forEach(tx => {
        console.log(`- ID: ${tx.id}`);
        console.log(`  PIX ID: ${tx.pixTransactionId}`);
        console.log(`  External ID: ${tx.externalId}`);
        console.log(`  Status: ${tx.status}`);
        console.log(`  Amount: ${tx.amount} USDT`);
        console.log(`  BRL: R$ ${tx.brlAmount}`);
        console.log(`  User: ${tx.wallet.user.name} (${tx.wallet.user.email})`);
        console.log('---');
      });
      
      return;
    }

    console.log(`✅ Transaction found:`);
    console.log(`- ID: ${transaction.id}`);
    console.log(`- PIX ID: ${transaction.pixTransactionId}`);
    console.log(`- Status: ${transaction.status}`);
    console.log(`- Amount: ${transaction.amount} USDT`);
    console.log(`- BRL Amount: R$ ${transaction.brlAmount}`);
    console.log(`- User: ${transaction.wallet.user.name} (${transaction.wallet.user.email})`);
    console.log(`- Current Wallet Balance: ${transaction.wallet.balance} USDT`);

    if (transaction.status === 'COMPLETED') {
      console.log('⚠️ Transaction is already COMPLETED!');
      return;
    }

    if (transaction.status !== 'PENDING') {
      console.log(`⚠️ Transaction status is ${transaction.status}, not PENDING`);
      console.log('Continuing anyway...');
    }

    // Corrigir o valor se necessário (de 0.17 para valor correto)
    let correctAmount = parseFloat(transaction.amount);
    if (correctAmount < 1 && parseFloat(transaction.brlAmount) > 5) {
      // Recalcular com taxa correta: R$ 10,10 * 0.17 = 1.717 USDT
      correctAmount = parseFloat(transaction.brlAmount) * 0.17;
      console.log(`🔧 Correcting USDT amount: ${transaction.amount} -> ${correctAmount}`);
      
      await prisma.uSDTTransaction.update({
        where: { id: transaction.id },
        data: { amount: correctAmount }
      });
    }

    console.log('💰 Processing payment...');

    // Usar transação do Prisma para garantir atomicidade
    const result = await prisma.$transaction(async (tx) => {
      // Calcular novo saldo
      const currentBalance = parseFloat(transaction.wallet.balance);
      const newBalance = currentBalance + correctAmount;
      const newTotalDeposited = parseFloat(transaction.wallet.totalDeposited) + correctAmount;

      // Atualizar saldo da carteira
      await tx.uSDTWallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: newBalance,
          totalDeposited: newTotalDeposited
        }
      });

      // Marcar transação como completada
      const completedTransaction = await tx.uSDTTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          balanceAfter: newBalance,
          processedAt: new Date()
        }
      });

      return {
        transaction: completedTransaction,
        oldBalance: currentBalance,
        newBalance: newBalance,
        creditedAmount: correctAmount
      };
    });

    console.log('🎉 SUCCESS! Transaction processed:');
    console.log(`- Previous balance: ${result.oldBalance} USDT`);
    console.log(`- Credited amount: ${result.creditedAmount} USDT`);
    console.log(`- New balance: ${result.newBalance} USDT`);
    console.log(`- Transaction status: ${result.transaction.status}`);
    console.log(`- Processed at: ${result.transaction.processedAt}`);

  } catch (error) {
    console.error('❌ Error processing transaction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar com o PIX ID fornecido
const pixId = process.argv[2] || '68abbe3f7263418b3ecafa60';
processTransaction(pixId);