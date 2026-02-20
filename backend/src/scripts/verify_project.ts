
import admin from '../config/firebase';

async function checkProject() {
    try {
        console.log('🔥 Checking Firebase Admin Config...');
        const app = admin.app();
        console.log('   App Name:', app.name);
        console.log('   Options:', JSON.stringify(app.options, null, 2)); // This will print credential details safe-ish?

        // Better way: list 1 user and see the project ID in the response metadata if possible, 
        // or just rely on service account email which usually contains project ID.

        const serviceAccountEmail = (app.options.credential as any)?.clientEmail;
        console.log('   Service Account Email:', serviceAccountEmail);

        if (serviceAccountEmail && serviceAccountEmail.includes('derecholaboralmx-1180f')) {
            console.log('✅ Project ID MATCH: derecholaboralmx-1180f');
        } else {
            console.log('❌ Project ID MISMATCH! Check checks above.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

checkProject();
