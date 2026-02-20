import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
// import { AppTheme } from '../theme/colors'; // DISABLED FOR DEBUG

import AsyncStorage from '@react-native-async-storage/async-storage';

const WelcomeScreen = () => {
    const navigation = useNavigation<any>();

    const handleRoleSelect = async (role: 'worker' | 'lawyer' | 'pyme') => {
        try {
            await AsyncStorage.setItem('TEMP_ROLE_SELECTION', role);
        } catch (e) {
            console.error('Failed to save role', e);
        }
        navigation.navigate('Register' as never, { role } as never);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1e3799', '#3742fa']}
                style={styles.header}
            >
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/aliado_logo_new.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>Bienvenido</Text>
                <Text style={styles.subtitle}>¿Cómo quieres usar nuestra app?</Text>
            </LinearGradient>


            <ScrollView contentContainerStyle={styles.content}>
                {/* Worker Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('worker')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f8f9fa']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#e3f2fd' }]}>
                                <Ionicons name="person" size={32} color="#2196f3" />
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Soy Trabajador</Text>
                            <Text style={styles.cardDescription}>
                                Resuelve tus dudas laborales, calcula tu finiquito y conecta con abogados expertos.
                            </Text>
                            <View style={styles.cardAction}>
                                <Text style={[styles.actionText, { color: '#2196f3' }]}>Continuar como Trabajador</Text>
                                <Ionicons name="arrow-forward" size={20} color="#2196f3" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Lawyer Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('lawyer')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f8f9fa']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#fff3e0' }]}>
                                <Ionicons name="briefcase" size={32} color="#e65100" />
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Soy Abogado</Text>
                            <Text style={styles.cardDescription}>
                                Ofrece tus servicios, llega a nuevos clientes y gestiona tus casos desde un solo lugar.
                            </Text>
                            <View style={styles.cardAction}>
                                <Text style={[styles.actionText, { color: '#e65100' }]}>Continuar como Abogado</Text>
                                <Ionicons name="arrow-forward" size={20} color="#e65100" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Pyme Card */}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => handleRoleSelect('pyme')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#ffffff', '#f8f9fa']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.iconContainer}>
                            <View style={[styles.iconCircle, { backgroundColor: '#e0f7fa' }]}>
                                <Ionicons name="business" size={32} color="#00bcd4" />
                            </View>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>Soy Empresa/Pyme</Text>
                            <Text style={styles.cardDescription}>
                                Gestiona documentos, contratos y conecta con abogados corporativos.
                            </Text>
                            <View style={styles.cardAction}>
                                <Text style={[styles.actionText, { color: '#00bcd4' }]}>Continuar como Empresa</Text>
                                <Ionicons name="arrow-forward" size={20} color="#00bcd4" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => navigation.navigate('Login' as never)}
                >
                    <Text style={styles.loginText}>¿Ya tienes cuenta? <Text style={styles.loginLink}>Inicia Sesión</Text></Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.privacyLink}
                    onPress={() => navigation.navigate('PrivacyPolicy' as never, { type: 'GENERAL' } as never)}
                >
                    <Text style={styles.privacyText}>Política de Privacidad y Términos</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FD', // Lighter background
    },
    header: {
        paddingTop: 60, // Reduced from 80
        paddingBottom: 30, // Reduced from 40
        alignItems: 'center',
        borderBottomRightRadius: 24, // Slightly softer radius
        borderBottomLeftRadius: 24,
        elevation: 8,
        shadowColor: '#3742fa',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 10,
    },
    logoContainer: {
        width: 80, // Smaller logo
        height: 80,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logo: {
        width: 70,
        height: 70,
        borderRadius: 15,
    },
    title: {
        fontSize: 28, // Slightly smaller title
        fontWeight: '800', // Bolder
        color: '#fff',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.95)',
        marginTop: 5,
        fontWeight: '500',
    },
    content: {
        padding: 20,
        paddingBottom: 40, // Increased bottom padding for scrolling
    },
    card: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2, // Softer shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, // Lighter opacity
        shadowRadius: 6,
        backgroundColor: '#fff',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    cardGradient: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: 16,
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16, // Squircle shape
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2d3436',
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 13,
        color: '#636e72',
        lineHeight: 18,
        marginBottom: 12,
    },
    cardAction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        marginRight: 4,
    },
    loginButton: {
        marginTop: 20,
        marginBottom: 30, // Extra margin for safety
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#fff', // Add subtle background
        borderRadius: 12,
        marginHorizontal: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    loginText: {
        color: '#2d3436', // Much darker color
        fontSize: 16,     // Larger text
        fontWeight: '500',
    },
    loginLink: {
        color: '#1e3799',

        fontWeight: '800',
        fontSize: 16,
    },
    privacyLink: {
        marginTop: 0,
        marginBottom: 20,
        alignItems: 'center',
    },
    privacyText: {
        color: '#999',
        fontSize: 12,
        textDecorationLine: 'underline',
    },
});

export default WelcomeScreen;
