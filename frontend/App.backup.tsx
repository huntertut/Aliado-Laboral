import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useNotifications } from './src/hooks/useNotifications';

export default function App() {
    // Initialize notifications hook
    useNotifications();

    console.log('[DEBUG] App.tsx Rendering...');

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
