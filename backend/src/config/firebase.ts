import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

if (!admin.apps.length) {
    try {
        const serviceAccount = require(serviceAccountPath);
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
