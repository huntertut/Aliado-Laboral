import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator'; // ENABLED
// Interceptor Removed
import { AuthProvider } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useNotifications } from './src/hooks/useNotifications';

// MOCK REMOVED

// import firebase from '@react-native-firebase/app';
import { firebaseConfig } from './src/config/firebase';

// Initialize Firebase for Native SDKs (Analytics, etc) if not already done
// if (!firebase.apps.length) {
//     try {
//         firebase.initializeApp(firebaseConfig);
//         console.log('[App] Firebase Initialized Manually');
//     } catch (e) {
//         console.error('[App] Firebase Init Error:', e);
//     }
// }

export default function App() {
    // Initialize notifications hook
    useNotifications();

    // console.log('[DEBUG] App.tsx Rendering with Providers...');

    return (
        <StripeProvider
            publishableKey="pk_test_51Sb1MxAnr3rKmiaWJSPgHYSFqTC07ya0896cQuON6MIqibc8dqSw6bkOF2zJ3olI2LjguKaalLsbj3iiLnLDtqn700PScbxcDT"
        >
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </StripeProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2ecc71', // GREEN
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 16,
        color: 'white',
    }
});
