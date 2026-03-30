import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useNotifications } from './src/hooks/useNotifications';
import UpdateRequired from './src/screens/UpdateRequired';
import * as Application from 'expo-application';

const API_BASE = 'https://api.cibertmx.org/api';

function compareVersions(installed: string, required: string): boolean {
    const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
    const [a1, b1, c1] = parse(installed);
    const [a2, b2, c2] = parse(required);
    if (a1 !== a2) return a1 < a2;
    if (b1 !== b2) return b1 < b2;
    return c1 < c2;
}

export default function App() {
    useNotifications();

    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [storeUrl, setStoreUrl] = useState('market://details?id=com.cibertmx.aliadolaboral');
    const [updateChecked, setUpdateChecked] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/config/version`)
            .then(r => r.json())
            .then(data => {
                const installed = Application.nativeApplicationVersion || '1.0.0';
                const minVersion = Platform.OS === 'android' ? data.min_version_android : data.min_version_ios;
                const url = Platform.OS === 'android' ? data.update_url_android : data.update_url_ios;
                if (url) setStoreUrl(url);
                if (compareVersions(installed, minVersion)) setNeedsUpdate(true);
            })
            .catch(() => { /* Network error: let user in */ })
            .finally(() => setUpdateChecked(true));
    }, []);

    if (!updateChecked) return null;
    if (needsUpdate) return <UpdateRequired storeUrl={storeUrl} />;

    return (
        <StripeProvider publishableKey="pk_test_51Sb1MxAnr3rKmiaWJSPgHYSFqTC07ya0896cQuON6MIqibc8dqSw6bkOF2zJ3olI2LjguKaalLsbj3iiLnLDtqn700PScbxcDT">
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
