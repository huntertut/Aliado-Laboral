
import admin from '../config/firebase';

const users = [
    { email: 'lawyer_pro@test.com', password: '123456', role: 'lawyer' },
    { email: 'pyme_premium@test.com', password: '123456', role: 'pyme' },
    { email: 'worker_test@test.com', password: '123456', role: 'worker' }
];

async function fixUsers() {
    for (const u of users) {
        try {
            console.log(`Processing ${u.email}...`);
            // Try to fetch
            try {
                const user = await admin.auth().getUserByEmail(u.email);
                console.log(`User exists (${user.uid}). Updating password...`);
                await admin.auth().updateUser(user.uid, {
                    password: u.password,
                    emailVerified: true
                });
                console.log('✅ Password Updated.');
            } catch (fetchErr: any) {
                if (fetchErr.code === 'auth/user-not-found') {
                    console.log('User missing. Creating...');
                    await admin.auth().createUser({
                        email: u.email,
                        password: u.password,
                        emailVerified: true,
                        displayName: u.role.charAt(0).toUpperCase() + u.role.slice(1) // "Pyme", "Lawyer"
                    });
                    console.log('✅ User Created.');
                } else {
                    throw fetchErr;
                }
            }
        } catch (e) {
            console.error(`❌ Failed to process ${u.email}:`, e);
        }
    }
}

fixUsers();
