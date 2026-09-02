const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const engineers = await prisma.engineer.findMany();
    console.log(engineers);
}
main().finally(() => prisma.$disconnect());
