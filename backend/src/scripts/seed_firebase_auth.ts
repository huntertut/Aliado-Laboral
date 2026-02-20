
import admin from '../config/firebase';

const users = [
    // 1. Worker FREE
    {
        uid: 'C542fS47Q1ZVLR6xKc68WYL6XI53',
        email: 'worker_free@test.com',
        password: '123456',
        displayName: 'Trabajador Gratuito',
        role: 'worker'
    },
    // 2. Worker PREMIUM
    {
        uid: 'WzgiGwvO3ySXlFnkJU3FiRcAbq53',
        email: 'worker_premium@test.com',
        password: '123456',
        displayName: 'Trabajador Premium',
        role: 'worker'
    },
    // 3. Lawyer BASIC
    {
        uid: 'Z4UHLGmk1XcVx8blaT0KTJ5FSQS2',
        email: 'lawyer_basic@test.com',
        password: '123456',
        displayName: 'Abogado Plan Basico',
        role: 'lawyer'
    },
    // 4. Lawyer PRO
    {
        uid: 'CIaLXDcGO2NOu10bbFr1wZ41j7j2',
        email: 'lawyer_pro@test.com',
        password: '123456',
        displayName: 'Abogado Plan Pro',
        role: 'lawyer'
    },
    // 5. Admin
    {
        uid: 'TjPDy7Lyf9MVLIu7e30DOzMysSf1',
        email: 'admin@test.com',
        password: '123456',
        displayName: 'Admin General',
        role: 'admin'
    },
    // 6. Supervisor
    {
        uid: 'owa4rNOIESdMmJIucA06OSXKbh72',
        email: 'supervisor@test.com',
        password: '123456',
        displayName: 'Supervisor Legal',
        role: 'supervisor'
    },
    // 7. Contador
    {
        uid: 'pubVX53drUgWZD6WUfB6TQ0el1y2',
        email: 'contador@test.com',
        password: '123456',
        displayName: 'Contador App',
        role: 'accountant'
    },
    // 8. Pyme Basic
    {
        uid: 'M9KI2uXemYWElMmmDUxuMsM5jG62',
        email: 'pyme_basic@test.com',
        password: '123456',
        displayName: 'Pyme Básica SA',
        role: 'pyme'
    },
    // 9. Pyme Premium
    {
        uid: 'J5axjxXFuwW2H10fayGZKq0IRTs1',
        email: 'pyme_premium@test.com',
        password: '123456',
        displayName: 'Pyme Premium SC',
        role: 'pyme'
    }
];

async function seedFirebaseAuth() {
    console.log('🔥 Seeding Firebase Auth Users...');

    for (const user of users) {
        try {
            await admin.auth().updateUser(user.uid, {
                password: user.password,
                displayName: user.displayName,
                emailVerified: true
            });
            console.log(`✅ Updated: ${user.email}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                console.log(`Creating new user ${user.email}...`);
                await admin.auth().createUser({
                    uid: user.uid,
                    email: user.email,
                    password: user.password,
                    displayName: user.displayName,
                    emailVerified: true
                });
                console.log(`✅ Created: ${user.email}`);
            } else {
                console.error(`❌ Error with ${user.email}:`, error.message);
            }
        }
    }
    console.log('✅ Firebase Seeding Complete.');
}

seedFirebaseAuth()
    .catch(console.error)
    .finally(() => process.exit(0));
