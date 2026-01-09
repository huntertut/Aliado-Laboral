import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDemoLawyer() {
    const email = 'lawyer_basic@test.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            lawyerProfile: {
                include: {
                    subscription: true,
                    profile: true
                }
            }
        }
    });

    console.log('--- User Info ---');
    console.log('ID:', user?.id);
    console.log('Email:', user?.email);
    console.log('Plan in User table:', user?.plan);
    console.log('Role:', user?.role);

    if (user?.lawyerProfile) {
        console.log('\n--- Lawyer Info ---');
        console.log('Lawyer ID:', user.lawyerProfile.id);

        console.log('\n--- Subscription Info ---');
        console.log(JSON.stringify(user.lawyerProfile.subscription, null, 2));

        console.log('\n--- Profile Info ---');
        console.log('Attention Hours:', user.lawyerProfile.profile?.attentionHours);
    } else {
        console.log('\n❌ No Lawyer record found for this user.');
    }

    await prisma.$disconnect();
}

checkDemoLawyer();
