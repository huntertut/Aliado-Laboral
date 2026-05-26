const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const userId = 'da1b5b52-39a3-444f-9372-d8e1b7cd921b';
        const plan = 'pro';
        const durationMonths = 1;

        console.log('Fetching user...');
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        console.log('User Exists:', !!userExists);
        if (userExists) console.log('User Role:', userExists.role);

        const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
        console.log('Lawyer Exists:', !!lawyer);
        if (lawyer) console.log('Lawyer ID:', lawyer.id);

        console.log('Done test.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
run();
