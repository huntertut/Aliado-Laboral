import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLawyerPlans() {
    console.log('--- Fixing Lawyer Plans ---');

    // 1. Update lawyer_basic@test.com
    await prisma.user.updateMany({
        where: { email: 'lawyer_basic@test.com' },
        data: { plan: 'basic' }
    });

    // 2. Update lawyer_pro@test.com
    await prisma.user.updateMany({
        where: { email: 'lawyer_pro@test.com' },
        data: { plan: 'pro' }
    });

    // 3. Ensure they have active subscriptions (extending for 1 month)
    const lawyers = await prisma.lawyer.findMany({
        include: { subscription: true }
    });

    for (const lawyer of lawyers) {
        if (lawyer.subscription) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            await prisma.lawyerSubscription.update({
                where: { id: lawyer.subscription.id },
                data: {
                    status: 'active',
                    endDate: endDate
                }
            });
            console.log(`Updated subscription for lawyer ID: ${lawyer.id}`);
        }
    }

    console.log('✅ Fix complete.');
    await prisma.$disconnect();
}

fixLawyerPlans();
