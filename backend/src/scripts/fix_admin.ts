
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import admin from '../config/firebase';

const prisma = new PrismaClient();

async function fixAdmin() {
    console.log('🔧 Fixing Admin User...');
    const email = 'admin@test.com';
    const password = 'password123';
    const name = 'Super Admin';

    // 1. Firebase Upsert
    try {
        await admin.auth().getUserByEmail(email);
        console.log('✅ Firebase User exists');
    } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
            await admin.auth().createUser({
                email,
                password,
                displayName: name,
                emailVerified: true
            });
            console.log('✅ Created Firebase User');
        } else {
            console.error('Firebase Error:', e);
        }
    }

    // 2. Prisma Upsert
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'admin',
            plan: 'pro',
            passwordHash: hashedPassword,
            fullName: name
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: 'admin',
            plan: 'pro',
            fullName: name
        }
    });

    console.log(`✅ Database User Synced: ${user.id} (${user.role})`);

    // 3. UserRole Sync
    const fbUser = await admin.auth().getUserByEmail(email);

    // Check by UID
    const roleByUid = await prisma.userRole.findUnique({ where: { firebaseUid: fbUser.uid } });

    if (roleByUid) {
        await prisma.userRole.update({
            where: { id: roleByUid.id },
            data: { userId: user.id, role: 'admin' }
        });
        console.log('✅ UserRole Linked (UID match)');
    } else {
        await prisma.userRole.create({
            data: {
                firebaseUid: fbUser.uid,
                role: 'admin',
                userId: user.id,
                email: email,
                fullName: name
            }
        });
        console.log('✅ UserRole Created');
    }

    console.log('🎉 Admin Fix Complete. Login with admin@test.com / password123');
}

fixAdmin()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
