import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      balance: 50000.00,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      balance: 75000.00,
    },
  });

  // Create sample stocks
  const stocks = await Promise.all([
    prisma.stock.create({
      data: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 175.50,
        lastUpdated: new Date(),
      },
    }),
    prisma.stock.create({
      data: {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 142.30,
        lastUpdated: new Date(),
      },
    }),
    prisma.stock.create({
      data: {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 378.85,
        lastUpdated: new Date(),
      },
    }),
    prisma.stock.create({
      data: {
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        price: 248.42,
        lastUpdated: new Date(),
      },
    }),
    prisma.stock.create({
      data: {
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        price: 168.72,
        lastUpdated: new Date(),
      },
    }),
  ]);

  // Create portfolios for users
  const portfolio1 = await prisma.portfolio.create({
    data: {
      userId: user1.id,
      name: 'Tech Growth Portfolio',
    },
  });

  const portfolio2 = await prisma.portfolio.create({
    data: {
      userId: user2.id,
      name: 'Diversified Portfolio',
    },
  });

  // Add some stocks to portfolios
  await Promise.all([
    prisma.portfolioStock.create({
      data: {
        portfolioId: portfolio1.id,
        stockId: stocks[0].id, // AAPL
        quantity: 100,
        averagePrice: 170.00,
      },
    }),
    prisma.portfolioStock.create({
      data: {
        portfolioId: portfolio1.id,
        stockId: stocks[2].id, // MSFT
        quantity: 50,
        averagePrice: 350.00,
      },
    }),
    prisma.portfolioStock.create({
      data: {
        portfolioId: portfolio2.id,
        stockId: stocks[1].id, // GOOGL
        quantity: 75,
        averagePrice: 140.00,
      },
    }),
    prisma.portfolioStock.create({
      data: {
        portfolioId: portfolio2.id,
        stockId: stocks[4].id, // AMZN
        quantity: 25,
        averagePrice: 160.00,
      },
    }),
  ]);

  // Create sample transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        userId: user1.id,
        stockId: stocks[0].id,
        portfolioId: portfolio1.id,
        type: 'BUY',
        quantity: 100,
        price: 170.00,
        totalAmount: 17000.00,
        status: 'SUCCESS',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user1.id,
        stockId: stocks[2].id,
        portfolioId: portfolio1.id,
        type: 'BUY',
        quantity: 50,
        price: 350.00,
        totalAmount: 17500.00,
        status: 'SUCCESS',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user2.id,
        stockId: stocks[1].id,
        portfolioId: portfolio2.id,
        type: 'BUY',
        quantity: 75,
        price: 140.00,
        totalAmount: 10500.00,
        status: 'SUCCESS',
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user2.id,
        stockId: stocks[4].id,
        portfolioId: portfolio2.id,
        type: 'BUY',
        quantity: 25,
        price: 160.00,
        totalAmount: 4000.00,
        status: 'SUCCESS',
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`👤 Created ${await prisma.user.count()} users`);
  console.log(`📈 Created ${await prisma.stock.count()} stocks`);
  console.log(`💼 Created ${await prisma.portfolio.count()} portfolios`);
  console.log(`📊 Created ${await prisma.portfolioStock.count()} portfolio stocks`);
  console.log(`💰 Created ${await prisma.transaction.count()} transactions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
