
import admin from '../config/firebase';

async function generateResetLink() {
    const email = 'admin@test.com';
    try {
        console.log(`🔗 Generating Password Reset Link for ${email}...`);
        const link = await admin.auth().generatePasswordResetLink(email);
        console.log('✅ LINK GENERATED:');
        console.log(link);
    } catch (e: any) {
        console.log('❌ Error:', e.message);
    }
}

generateResetLink();
