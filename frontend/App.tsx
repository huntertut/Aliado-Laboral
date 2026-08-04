// Production Build v1.3.2 - versionCode-based update check
import React, { useState, useEffect } from 'react';
import 'react-native-gesture-handler';
import { Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useNotifications } from './src/hooks/useNotifications';
import UpdateRequired from './src/screens/UpdateRequired';
import OTAUpdateScreen from './src/screens/OTAUpdateScreen';
import * as Application from 'expo-application';
import * as Updates from 'expo-updates';

const API_BASE = 'https://api.cibertmx.org/api';

// Comparación por string de versión (compatibilidad hacia atrás - apps antiguas)
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
    const [otaChecked, setOtaChecked] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const checkUpdates = async () => {
            // 1. Background OTA Check
            try {
                if (!__DEV__) {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        setIsUpdating(true);
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                        return; // App will reload
                    }
                }
            } catch (err) {
                console.log('[App] OTA Update check skipped or failed:', err);
            } finally {
                setOtaChecked(true);
            }

            // 2. Force Version Check from API
            try {
                const r = await fetch(`${API_BASE}/config/version`);
                const data = await r.json();
                const url = Platform.OS === 'android' ? data.update_url_android : data.update_url_ios;
                if (url) setStoreUrl(url);

                const minBuild = Platform.OS === 'android' ? data.min_build_android : data.min_build_ios;
                const installedBuild = parseInt(Application.nativeBuildVersion || '0', 10);

                if (minBuild && minBuild > 0) {
                    // Comparación precisa por versionCode (apps >= 1.3.2)
                    console.log(`[App] Build check: installed=${installedBuild} min=${minBuild}`);
                    if (installedBuild < minBuild) setNeedsUpdate(true);
                } else {
                    // Fallback: comparación por string de versión (compatibilidad apps antiguas)
                    const installed = Application.nativeApplicationVersion || '1.0.0';
                    const minVersion = Platform.OS === 'android' ? data.min_version_android : data.min_version_ios;
                    console.log(`[App] Version check: installed=${installed} min=${minVersion}`);
                    if (compareVersions(installed, minVersion)) setNeedsUpdate(true);
                }
            } catch (err) {
                console.log('[App] Version config check failed:', err);
            } finally {
                setUpdateChecked(true);
            }
        };

        checkUpdates();
    }, []);


    if (isUpdating) {
        return <OTAUpdateScreen onComplete={() => {}} />;
    }

    if (!otaChecked || !updateChecked) {
        return null;
    }

    if (needsUpdate) {
        return <UpdateRequired storeUrl={storeUrl} />;
    }

    return (
        <StripeProvider publishableKey="pk_live_51Sb1MxAnr3rKpbBY4DVvjsiYdgJmdwaWd5zQMGX9BAIDvwZgLPPMxAn0qr8QD5nQ63QrDs1P23jOjtn2M2sy702HFY00P1PJUdTr">
            <AuthProvider>
                <AppNavigator />
            </AuthProvider>
        </StripeProvider>
    );
}
