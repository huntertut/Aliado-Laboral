
import admin from '../config/firebase';

async function inspectUser() {
    const email = 'admin@test.com';
    try {
        console.log(`🔍 Inspecting ${email}...`);
        const user = await admin.auth().getUserByEmail(email);
        console.log('✅ User Found!');
        console.log('   UID:', user.uid);
        console.log('   Email:', user.email);
        console.log('   Password Hash set:', !!user.passwordHash);
        console.log('   Password Salt set:', !!user.passwordSalt);
        console.log('   Last Sign In:', user.metadata.lastSignInTime);
        console.log('   Creation Time:', user.metadata.creationTime);
        console.log('   Providers:', user.providerData.map(p => p.providerId));

    } catch (e: any) {
        console.log('❌ User Fetch Error:', e.code, e.message);
    }
}

inspectUser();
