import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    take: 5,
  });

  console.log('Users in database:');
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
  });

  const portfolios = await prisma.portfolio.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
    },
    take: 5,
  });

  console.log('\nPortfolios in database:');
  portfolios.forEach(portfolio => {
    console.log(`- ID: ${portfolio.id}, UserID: ${portfolio.userId}, Name: ${portfolio.name}`);
  });
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
