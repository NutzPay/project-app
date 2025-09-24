// Script to activate acquirers and create test user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixAcquirers() {
  console.log('🔧 Fixing acquirers and creating test data...\n');

  try {
    // 1. Activate all payment acquirers
    console.log('📊 Activating payment acquirers...');
    const activatedAcquirers = await prisma.paymentAcquirer.updateMany({
      data: { status: 'ACTIVE' }
    });
    console.log(`✅ Activated ${activatedAcquirers.count} acquirers`);

    // 2. List current acquirers
    const acquirers = await prisma.paymentAcquirer.findMany({
      select: { id: true, name: true, type: true, status: true }
    });
    console.log('Current acquirers:');
    acquirers.forEach(acq => {
      console.log(`  - ${acq.name} (${acq.type}) - ${acq.status}`);
    });

    // 3. Create test user if no users exist
    const userCount = await prisma.user.count();
    console.log(`\n👥 Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('password', 10);
      
      const testUser = await prisma.user.create({
        data: {
          email: 'felix@nutzbeta.com',
          password: hashedPassword,
          name: 'Felix Test User',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      
      console.log(`✅ Created test user: ${testUser.email} (${testUser.id.substring(0,8)}...)`);
      
      // 4. Assign all acquirers to the test user
      console.log('\n🔗 Assigning acquirers to test user...');
      for (const acquirer of acquirers) {
        await prisma.userAcquirer.create({
          data: {
            userId: testUser.id,
            acquirerId: acquirer.id,
            priority: acquirer.type === 'PIX' ? 10 : 5,
            dailyLimit: 10000,
            monthlyLimit: 100000,
            isActive: true
          }
        });
        console.log(`  ✅ Assigned ${acquirer.name} (${acquirer.type})`);
      }
    } else {
      console.log('Users already exist, skipping user creation');
      
      // Still assign acquirers to existing users
      console.log('\n🔗 Assigning acquirers to existing users...');
      const users = await prisma.user.findMany();
      
      for (const user of users) {
        console.log(`\nProcessing user: ${user.email}`);
        
        for (const acquirer of acquirers) {
          const existingAssignment = await prisma.userAcquirer.findFirst({
            where: { userId: user.id, acquirerId: acquirer.id }
          });
          
          if (!existingAssignment) {
            await prisma.userAcquirer.create({
              data: {
                userId: user.id,
                acquirerId: acquirer.id,
                priority: acquirer.type === 'PIX' ? 10 : 5,
                dailyLimit: 10000,
                monthlyLimit: 100000,
                isActive: true
              }
            });
            console.log(`  ✅ Assigned ${acquirer.name} (${acquirer.type})`);
          } else {
            console.log(`  ⚠️  ${acquirer.name} already assigned`);
          }
        }
      }
    }

    // 5. Show final summary
    console.log('\n📊 FINAL SUMMARY:');
    const finalUsers = await prisma.user.count();
    const finalAcquirers = await prisma.paymentAcquirer.count({ where: { status: 'ACTIVE' } });
    const finalAssignments = await prisma.userAcquirer.count({ where: { isActive: true } });
    
    console.log(`Users: ${finalUsers}`);
    console.log(`Active Acquirers: ${finalAcquirers}`);
    console.log(`Active Assignments: ${finalAssignments}`);

    console.log('\n✅ Fix completed successfully!');

  } catch (error) {
    console.error('❌ Error during fix:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixAcquirers().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { fixAcquirers };