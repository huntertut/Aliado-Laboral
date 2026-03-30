import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Image,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    storeUrl: string;
}

export default function UpdateRequired({ storeUrl }: Props) {
    const handleUpdate = () => {
        Linking.openURL(storeUrl).catch(err =>
            console.error('[UpdateRequired] Error al abrir la tienda:', err)
        );
    };

    return (
        <LinearGradient
            colors={['#0f2044', '#1a3a6b', '#1565c0']}
            style={styles.container}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0f2044" />

            {/* Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('../assets/images/logo_m_pro.jpg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            {/* Icon */}
            <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>🔄</Text>
            </View>

            {/* Text */}
            <Text style={styles.title}>Actualización Requerida</Text>
            <Text style={styles.subtitle}>
                Hay una nueva versión de{'\n'}
                <Text style={styles.appName}>Aliado Laboral</Text>
                {'\n'}disponible con mejoras y correcciones importantes.
            </Text>
            <Text style={styles.description}>
                Por favor actualiza la aplicación para continuar disfrutando del servicio.
            </Text>

            {/* Update Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleUpdate}
                activeOpacity={0.85}
            >
                <Text style={styles.buttonText}>Actualizar Ahora</Text>
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footer}>
                Esta actualización es requerida para continuar.
            </Text>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logoContainer: {
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 20,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    iconEmoji: {
        fontSize: 32,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.80)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 8,
    },
    appName: {
        fontWeight: '700',
        color: '#7dd3fc',
    },
    description: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.60)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        marginBottom: 20,
        minWidth: 220,
        alignItems: 'center',
    },
    buttonText: {
        color: '#1565c0',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    footer: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
    },
});
