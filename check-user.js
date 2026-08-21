const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const eng = await prisma.engineer.findUnique({
    where: { icNumber: '951031105707' }
  });
  console.log('Engineer Data:', eng);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
