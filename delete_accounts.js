const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const icNumbers = ['050831101677', '050831101678'];
  
  for (const ic of icNumbers) {
    try {
      const engineer = await prisma.engineer.findUnique({
        where: { icNumber: ic }
      });
      
      if (!engineer) {
        console.log(`Engineer with IC ${ic} not found.`);
        continue;
      }
      
      // Detach reports
      await prisma.report.updateMany({
        where: { engineerId: engineer.id },
        data: { engineerId: null }
      });
      
      // Delete engineer
      await prisma.engineer.delete({
        where: { icNumber: ic }
      });
      console.log(`Successfully deleted engineer with IC ${ic}`);
    } catch (e) {
      console.error(`Error processing IC ${ic}:`, e);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
