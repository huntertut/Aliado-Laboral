const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: { OR: [ { email: { contains: 'elmisamouse' } }, { fullName: { contains: 'elmisamouse' } } ] },
        include: {
            lawyerProfile: true,
            workerProfile: true,
            pymeProfile: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
