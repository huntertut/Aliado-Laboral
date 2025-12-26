
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users for Business Model...');

    const password = '123456';
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = [
        // 1. Worker FREE
        {
            id: 'C542fS47Q1ZVLR6xKc68WYL6XI53', // Firebase UID
            email: 'worker_free@test.com',
            passwordHash: hashedPassword,
            fullName: 'Trabajador Gratuito',
            role: 'worker',
            plan: 'free',
            subscriptionStatus: 'inactive',
        },
        // 2. Worker PREMIUM
        {
            id: 'WzgiGwvO3ySXlFnkJU3FiRcAbq53', // Firebase UID
            email: 'worker_premium@test.com',
            passwordHash: hashedPassword,
            fullName: 'Trabajador Premium',
            role: 'worker',
            plan: 'premium',
            subscriptionStatus: 'active',
        },
        // 3. Lawyer BASIC
        {
            id: 'Z4UHLGmk1XcVx8blaT0KTJ5FSQS2', // Firebase UID
            email: 'lawyer_basic@test.com',
            passwordHash: hashedPassword,
            fullName: 'Abogado Plan Basico',
            role: 'lawyer',
            plan: 'basic',
            subscriptionStatus: 'active',
            licenseNumber: 'LBASIC001',
            specialty: 'Laboral General'
        },
        // 4. Lawyer PRO
        {
            id: 'CIaLXDcGO2NOu10bbFr1wZ41j7j2', // Firebase UID
            email: 'lawyer_pro@test.com',
            passwordHash: hashedPassword,
            fullName: 'Abogado Plan Pro',
            role: 'lawyer',
            plan: 'pro',
            subscriptionStatus: 'active',
            licenseNumber: 'LPRO001',
            specialty: 'Defensa Patronal y Laboral'
        }
    ];

    for (const userData of users) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: userData.email },
        });

        if (existingUser) {
            console.log(`User ${userData.email} already exists. Updating plan...`);
            await prisma.user.update({
                where: { email: userData.email },
                data: {
                    plan: userData.role === 'worker' ? userData.plan : undefined
                }
            });
            // We verify/create aux data even if user exists
        } else {
            // Create User with specific ID
            await prisma.user.create({
                data: {
                    id: userData.id, // Explicit ID from Firebase
                    email: userData.email,
                    passwordHash: userData.passwordHash,
                    fullName: userData.fullName,
                    role: userData.role,
                    plan: userData.plan || 'free',
                },
            });
            console.log(`Created user: ${userData.email}`);
        }

        // Re-fetch user to get ID (in case it existed)
        const user = await prisma.user.findUnique({ where: { email: userData.email } });
        if (!user) continue;

        // Handle Worker Subscription
        if (userData.role === 'worker') {
            // Check if subscription exists
            const existingSub = await prisma.workerSubscription.findUnique({ where: { userId: user.id } });
            if (!existingSub && userData.plan === 'premium') {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 12);

                await prisma.workerSubscription.create({
                    data: {
                        userId: user.id,
                        status: 'active',
                        startDate: new Date(),
                        endDate: endDate,
                        amount: 29.00,
                        autoRenew: false
                    }
                });
                console.log(` -> Worker Premium subscription created.`);
            }
        }

        // Handle Lawyer Subscription
        if (userData.role === 'lawyer') {
            const existingLawyer = await prisma.lawyer.findUnique({ where: { userId: user.id } });
            let lawyerId = existingLawyer?.id;

            if (!existingLawyer) {
                const lawyer = await prisma.lawyer.create({
                    data: {
                        userId: user.id,
                        licenseNumber: userData.licenseNumber!,
                        specialty: userData.specialty,
                        isVerified: true,
                        nationalScope: true,
                        availableStates: 'CDMX,Jalisco',
                        professionalName: userData.fullName,
                    }
                });
                lawyerId = lawyer.id;
            }

            if (lawyerId) {
                // Check subscription
                const existingSub = await prisma.lawyerSubscription.findUnique({ where: { lawyerId } });
                if (!existingSub) {
                    const endDate = new Date();
                    endDate.setMonth(endDate.getMonth() + 1);

                    await prisma.lawyerSubscription.create({
                        data: {
                            lawyerId: lawyerId,
                            status: userData.subscriptionStatus,
                            plan: userData.plan,
                            startDate: new Date(),
                            endDate: endDate,
                            amount: userData.plan === 'pro' ? 299.00 : 99.00,
                            autoRenew: true
                        }
                    });
                }

                // Check Profile
                const existingProfile = await prisma.lawyerProfile.findUnique({ where: { lawyerId } });
                if (!existingProfile) {
                    await prisma.lawyerProfile.create({
                        data: {
                            lawyerId: lawyerId,
                            yearsOfExperience: userData.plan === 'pro' ? 10 : 3,
                            bio: `Abogado ${userData.plan.toUpperCase()} comprometido.`,
                            phone: '5512345678',
                            whatsapp: '5512345678',
                            email: userData.email,
                            attentionHours: 'Lun-Vie 9:00-18:00'
                        }
                    });
                    console.log(` -> Lawyer ${userData.plan} profile set.`);
                }
            }
        }

        // Create/Update UserRole mapping (Critical for Firebase Auth)
        await prisma.userRole.upsert({
            where: { firebaseUid: userData.id }, // ID from users array is the Firebase UID
            update: {
                userId: user.id,
                role: userData.role,
                email: userData.email,
                fullName: userData.fullName
            },
            create: {
                firebaseUid: userData.id,
                userId: user.id,
                role: userData.role,
                email: userData.email,
                fullName: userData.fullName
            }
        });
        console.log(` -> UserRole mapped for ${userData.email}`);
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
