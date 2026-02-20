import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    console.log('--- DIAGNOSTIC DATA ---');

    const email = 'lawyer_basic@test.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            lawyerProfile: {
                include: { subscription: true }
            }
        }
    });

    if (!user) {
        console.log(`User not found: ${email}`);
    } else {
        console.log('User Record:', JSON.stringify({
            id: user.id,
            email: user.email,
            role: user.role,
            plan: user.plan
        }, null, 2));

        if (user.lawyerProfile) {
            console.log('Lawyer Record found for user.');
            console.log('Subscription:', JSON.stringify(user.lawyerProfile.subscription, null, 2));
        } else {
            console.log('Lawyer profile NOT FOUND for user.');
        }
    }

    await prisma.$disconnect();
}

checkData();
