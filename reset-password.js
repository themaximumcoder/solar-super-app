const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const eng = await prisma.engineer.update({
    where: { icNumber: '951031105707' },
    data: { password: hashedPassword }
  });
  console.log('Password reset successfully for:', eng.firstName);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
