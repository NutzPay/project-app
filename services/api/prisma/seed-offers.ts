import { PrismaClient, OfferAudience } from '@prisma/client';

const prisma = new PrismaClient();

async function seedOffers() {
  try {
    console.log('🌱 Seeding offers...');

    // Get first admin user
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    const offers = [
      {
        title: 'Desconto 10% para novos clientes',
        subtitle: 'Aproveite nossa oferta especial para novos usuários da plataforma',
        ctaText: 'Cadastrar agora',
        imagePath: 'placeholder-offer-1.jpg',
        targetUrl: 'https://nutzpay.com/register',
        audience: OfferAudience.BUYER,
        isActive: true,
        sortOrder: 1,
        createdBy: adminUser.id,
      },
      {
        title: 'API Gratuita para Sellers',
        subtitle: 'Teste nossa API de pagamentos sem custos por 30 dias',
        ctaText: 'Acessar API',
        imagePath: 'placeholder-offer-2.jpg',
        targetUrl: 'https://nutzpay.com/api',
        audience: OfferAudience.SELLER,
        isActive: true,
        sortOrder: 2,
        createdBy: adminUser.id,
      },
      {
        title: 'Black Friday - Taxas Reduzidas',
        subtitle: 'Aproveite taxas especiais durante todo o mês de novembro',
        ctaText: 'Ver ofertas',
        imagePath: 'placeholder-offer-3.jpg',
        targetUrl: 'https://nutzpay.com/black-friday',
        audience: OfferAudience.ALL,
        isActive: true,
        startsAt: new Date('2024-11-01'),
        endsAt: new Date('2024-11-30'),
        sortOrder: 0,
        createdBy: adminUser.id,
      },
      {
        title: 'Webinar: Como integrar pagamentos',
        subtitle: 'Participe do nosso webinar gratuito sobre integração de APIs',
        ctaText: 'Inscrever-se',
        imagePath: 'placeholder-offer-4.jpg',
        targetUrl: 'https://nutzpay.com/webinar',
        audience: OfferAudience.SELLER,
        isActive: true,
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        sortOrder: 3,
        createdBy: adminUser.id,
      },
    ];

    for (const offer of offers) {
      await prisma.offer.create({
        data: offer,
      });
    }

    console.log('✅ Offers seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding offers:', error);
  }
}

seedOffers()
  .then(() => {
    console.log('🎉 Seed completed');
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });