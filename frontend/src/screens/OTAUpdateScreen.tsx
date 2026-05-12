import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';

interface OTAUpdateScreenProps {
    onComplete: () => void;
}

export default function OTAUpdateScreen({ onComplete }: OTAUpdateScreenProps) {
    useEffect(() => {
        const fetchUpdate = async () => {
            try {
                // Short delay to let the user see the screen
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                if (!__DEV__) {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                        return; // App will restart, don't call onComplete
                    }
                }
                
                // No update or dev mode
                onComplete();
            } catch (err) {
                console.error('[OTAUpdateScreen] Error fetching update:', err);
                // If update fails, just let the user into the app
                onComplete();
            }
        };

        fetchUpdate();
    }, []);

    return (
        <LinearGradient
            colors={['#0f2044', '#1e3799']}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0f2044" />

            <View style={styles.content}>
                <Image
                    source={require('../assets/images/logo_m_pro.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Mejorando Aliado Laboral</Text>
                    <Text style={styles.subtitle}>
                        Estamos descargando las últimas actualizaciones y mejoras para ti.
                    </Text>
                </View>

                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loaderText}>Descargando... no cierres la App</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Aliado Laboral © 2026</Text>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 25,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        lineHeight: 24,
    },
    loaderContainer: {
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 15,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
    },
});
