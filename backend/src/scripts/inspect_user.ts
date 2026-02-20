import admin from '../config/firebase';

async function inspect() {
    const emails = ['lawyer_pro@test.com', 'pyme_premium@test.com', 'worker_test@test.com'];
    for (const email of emails) {
        try {
            console.log(`\n🔍 Inspecting ${email}...`);
            const user = await admin.auth().getUserByEmail(email);
            console.log('✅ User Found!');
            console.log('   UID:', user.uid);
            console.log('   Password Hash set:', !!user.passwordHash);
        } catch (e: any) {
            console.log(`❌ Error inspecting ${email}:`, e.code);
        }
    }
}

inspect();
