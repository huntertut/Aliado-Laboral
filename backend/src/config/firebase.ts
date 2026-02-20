import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (!admin.apps.length) {
    try {
        let serviceAccount;

        // 1. Try Environment Variable (Production)
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.log('Using Firebase Credential from Environment Variable');
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        }
        // 2. Try Local File (Development)
        else {
            console.log('Using Firebase Credential from Local File');
            serviceAccount = require(serviceAccountPath);
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: 'derecholaboralmx-1180f.appspot.com'
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Error initializing Firebase Admin:', error);
    }
}

export default admin;
