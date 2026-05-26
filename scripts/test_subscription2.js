const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    try {
        const userId = 'da1b5b52-39a3-444f-9372-d8e1b7cd921b';
        console.log("Checking User...");
        const user = await prisma.user.update({ where: { id: userId }, data: { plan: 'pro' } });
        console.log("User updated", user.id);

        const lawyer = await prisma.lawyer.findUnique({ where: { userId } });
        if (!lawyer) throw new Error("Lawyer not found");
        console.log("Lawyer found", lawyer.id);

        await prisma.lawyerSubscription.upsert({
            where: { lawyerId: lawyer.id },
            update: { status: 'active', plan: 'pro' },
            create: { lawyerId: lawyer.id, status: 'active', plan: 'pro', amount: 299.00 }
        });
        console.log("Subscription upserted");

        await prisma.lawyer.update({
            where: { id: lawyer.id },
            data: { acceptsPymeClients: true, subscriptionStatus: 'active' }
        });
        console.log("Lawyer updated");

    } catch (e) {
        console.error("PRISMA ERROR MESSAGE:", e.message);
        console.error("PRISMA ERROR:", JSON.stringify(e));
    } finally {
        await prisma.$disconnect();
    }
}
run();
