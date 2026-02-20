import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding special users...');

    // Supervisor Data
    const supervisor = {
        email: 'supervisor@test.com',
        uid: 'owa4rNOIESdMmJIucA06OSXKbh72',
        role: 'supervisor',
        fullName: 'Supervisor General'
    };

    // Accountant Data
    const accountant = {
        email: 'contador@test.com',
        uid: 'pubVX53drUgWZD6WUfB6TQ0el1y2',
        role: 'accountant',
        fullName: 'Contador Principal'
    };

    const users = [supervisor, accountant];

    for (const userData of users) {
        try {
            // 1. Create or Update in User table
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    role: userData.role,
                    fullName: userData.fullName
                },
                create: {
                    email: userData.email,
                    role: userData.role,
                    fullName: userData.fullName,
                    passwordHash: 'firebase_managed', // Placeholder
                },
            });

            console.log(`User seeded: ${user.email} (${user.id})`);

            // 2. Create or Update in UserRole table (Firebase mapping)
            await prisma.userRole.upsert({
                where: { firebaseUid: userData.uid },
                update: {
                    role: userData.role,
                    userId: user.id
                },
                create: {
                    firebaseUid: userData.uid,
                    role: userData.role,
                    email: userData.email,
                    fullName: userData.fullName,
                    userId: user.id
                },
            });

            console.log(`UserRole mapping seeded for: ${userData.email}`);

        } catch (error) {
            console.error(`Error seeding ${userData.email}:`, error);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
