import { PrismaClient, UserRole, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default plans
  const basicPlan = await prisma.plan.upsert({
    where: { id: 'plan_basic' },
    update: {},
    create: {
      id: 'plan_basic',
      name: 'Basic',
      description: 'Plano básico para pequenos negócios',
      monthlyFee: 99.90,
      transactionFee: 2.99,
      monthlyLimit: 10000.00,
      dailyLimit: 1000.00,
      requestsPerMinute: 100,
      featuresJson: JSON.stringify([
        'API Keys limitadas',
        'Webhooks básicos',
        'Relatórios simples'
      ]),
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { id: 'plan_pro' },
    update: {},
    create: {
      id: 'plan_pro',
      name: 'Professional',
      description: 'Plano profissional com recursos avançados',
      monthlyFee: 299.90,
      transactionFee: 2.49,
      monthlyLimit: 100000.00,
      dailyLimit: 10000.00,
      requestsPerMinute: 300,
      featuresJson: JSON.stringify([
        'API Keys ilimitadas',
        'Webhooks avançados',
        'Relatórios detalhados',
        'Suporte prioritário'
      ]),
    },
  });

  // Create super admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@nutzbeta.com' },
    update: {},
    create: {
      email: 'admin@nutzbeta.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create example company
  const exampleCompany = await prisma.company.upsert({
    where: { document: '12345678000100' },
    update: {},
    create: {
      name: 'Empresa Exemplo LTDA',
      email: 'contato@exemplo.com',
      document: '12345678000100',
      status: CompanyStatus.ACTIVE,
      planId: proPlan.id,
      monthlyLimit: proPlan.monthlyLimit,
      dailyLimit: proPlan.dailyLimit,
      requestsPerMinute: proPlan.requestsPerMinute,
    },
  });

  // Create company owner
  const companyOwner = await prisma.user.upsert({
    where: { email: 'owner@exemplo.com' },
    update: {},
    create: {
      email: 'owner@exemplo.com',
      name: 'João Silva',
      password: await bcrypt.hash('owner123', 12),
      role: UserRole.OWNER,
      companyId: exampleCompany.id,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  // Create dummy API key for testing
  const apiKeyValue = 'ntz_test_' + crypto.randomBytes(24).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  const keyHash = crypto
    .createHmac('sha256', process.env.API_KEY_SALT || 'default-salt')
    .update(apiKeyValue + salt)
    .digest('hex');

  const dummyApiKey = await prisma.apiKey.upsert({
    where: { keyHash },
    update: {},
    create: {
      name: 'Chave de Teste',
      keyHash,
      keySalt: salt,
      prefix: 'ntz_test_',
      scopes: ['payments:read', 'payments:write', 'webhooks:*'],
      ipWhitelist: [],
      userId: companyOwner.id,
      companyId: exampleCompany.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('👤 Super Admin: admin@nutzbeta.com / admin123');
  console.log('🏢 Company Owner: owner@exemplo.com / owner123');
  console.log('🔑 Test API Key:', apiKeyValue);
  console.log('   (This key is shown only once!)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });