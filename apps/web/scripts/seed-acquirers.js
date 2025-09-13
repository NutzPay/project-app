// Script to seed initial payment acquirers
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAcquirers() {
  console.log('🌱 Seeding payment acquirers...');

  try {
    // Remove any existing DigitoPay entries
    await prisma.paymentAcquirer.deleteMany({
      where: { slug: 'digitopay' }
    });

    // StarkBank (PIX)
    const starkBankConfig = await prisma.starkbankConfig.findFirst({
      where: { isActive: true }
    });

    await prisma.paymentAcquirer.upsert({
      where: { slug: 'starkbank' },
      update: {
        status: starkBankConfig ? 'ACTIVE' : 'INACTIVE'
      },
      create: {
        name: 'StarkBank',
        slug: 'starkbank',
        type: 'PIX',
        status: starkBankConfig ? 'ACTIVE' : 'INACTIVE',
        apiConfig: starkBankConfig ? JSON.stringify({
          projectId: starkBankConfig.projectId,
          environment: starkBankConfig.environment,
          configured: true
        }) : null,
        feeConfig: JSON.stringify({
          deposit: { type: 'FIXED', value: 1.00 },
          withdrawal: { type: 'FIXED', value: 1.00 }
        }),
        testMode: starkBankConfig?.environment === 'SANDBOX',
        supportsDeposits: true,
        supportsWithdrawals: true,
        supportsWebhooks: true,
        description: 'Processamento PIX empresarial com APIs robustas',
        logoUrl: null,
        documentationUrl: 'https://starkbank.com/docs'
      }
    });

    // XGate (Crypto)
    await prisma.paymentAcquirer.upsert({
      where: { slug: 'xgate' },
      update: {},
      create: {
        name: 'XGate',
        slug: 'xgate',
        type: 'CRYPTO',
        status: 'INACTIVE', // Will be activated after proper configuration
        apiConfig: JSON.stringify({
          apiUrl: 'https://api.xgateglobal.com',
          email: '',
          password: '',
          webhookUrl: ''
        }),
        feeConfig: JSON.stringify({
          deposit: { type: 'PERCENTAGE', value: 1.0 },
          withdrawal: { type: 'PERCENTAGE', value: 1.0 }
        }),
        testMode: true,
        supportsDeposits: true,
        supportsWithdrawals: true,
        supportsWebhooks: true,
        description: 'Gateway de criptomoedas para conversão BRL/USDT',
        logoUrl: null,
        documentationUrl: 'https://xgate.com/docs'
      }
    });

    console.log('✅ Payment acquirers seeded successfully');

    // Show summary
    const acquirers = await prisma.paymentAcquirer.findMany({
      select: {
        name: true,
        slug: true,
        type: true,
        status: true
      }
    });

    console.log('\n📊 Current acquirers:');
    acquirers.forEach(acq => {
      const statusIcon = acq.status === 'ACTIVE' ? '🟢' : '🔴';
      console.log(`${statusIcon} ${acq.name} (${acq.slug}) - ${acq.type} - ${acq.status}`);
    });

  } catch (error) {
    console.error('❌ Error seeding acquirers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedAcquirers().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { seedAcquirers };