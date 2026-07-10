

const prisma = require('../db/prisma');
const menu = require('../data/menu');

async function main() {
  console.log('Seeding menu items...');

  await prisma.menuItem.deleteMany();

  for (const item of menu) {
    await prisma.menuItem.create({ data: item });
  }

  console.log(`Seeded ${menu.length} menu items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

