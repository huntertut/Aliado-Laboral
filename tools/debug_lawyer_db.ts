
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLawyer() {
    console.log('🔍 Inspecting Lawyer Record...');

    // Find lawyer by email via User
    const user = await prisma.user.findUnique({
        where: { email: 'lawyer_pro@test.com' },
        include: {
            lawyer: {
                include: {
                    profile: true,
                    subscription: true
                }
            }
        }
    });

    if (!user) {
        console.log('❌ User not found!');
        return;
    }

    if (!user.lawyer) {
        console.log('❌ User is not a lawyer!');
        return;
    }

    const lawyer = user.lawyer;
    const profile = lawyer.profile;

    console.log('\n--- LAWYER STATUS ---');
    console.log(`ID: ${lawyer.id}`);
    console.log(`Verified: ${lawyer.isVerified}`);
    console.log(`Subscription Status: ${lawyer.subscription?.status}`);
    console.log(`Specialty: ${lawyer.specialty}`);
    console.log(`Accepts Federal: ${lawyer.acceptsFederalCases}`);
    console.log(`Accepts Local: ${lawyer.acceptsLocalCases}`);

    if (profile) {
        console.log('\n--- PROFILE DATA ---');
        console.log(`Won Case 1: ${profile.wonCase1Summary}`);
        console.log(`Won Case 2: ${profile.wonCase2Summary}`);
        console.log(`Photo URL: ${profile.photoUrl}`);
        console.log(`Views: ${profile.profileViews}`);
    } else {
        console.log('\n❌ NO PROFILE FOUND');
    }

    console.log('\n--- VISIBILITY CHECK ---');
    const isVisible =
        lawyer.isVerified === true &&
        lawyer.subscription?.status === 'active' &&
        profile?.wonCase1Summary != null &&
        profile?.wonCase2Summary != null;

    console.log(`Visible in Public API? ${isVisible ? 'YES ✅' : 'NO ❌'}`);
}

checkLawyer()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
