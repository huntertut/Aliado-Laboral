import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { BiometricAuthService } from '../services/BiometricAuthService';

const LoginScreen = () => {
    const navigation = useNavigation();
    const { login, register } = useAuth();
    const [localLoading, setLocalLoading] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Biometric State
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const availability = await BiometricAuthService.checkAvailability();
        const credentials = await BiometricAuthService.getCredentials();

        setIsBiometricAvailable(availability.hasHardware && availability.isEnrolled);
        setHasStoredCredentials(!!credentials.email && !!credentials.password);
    };

    const handleBiometricLogin = async () => {
        const isAuthenticated = await BiometricAuthService.authenticate();
        if (isAuthenticated) {
            setLocalLoading(true);
            try {
                const { email: storedEmail, password: storedPassword } = await BiometricAuthService.getCredentials();
                if (storedEmail && storedPassword) {
                    await login(storedEmail, storedPassword);
                } else {
                    Alert.alert('Error', 'Credenciales no encontradas. Inicia sesión manualmente primero.');
                }
            } catch (e: any) {
                Alert.alert('Error', 'Falló el inicio de sesión biométrico.');
            } finally {
                setLocalLoading(false);
            }
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa correo y contraseña');
            return;
        }

        setLocalLoading(true);
        try {
            await login(email.trim(), password);

            // Auto-save for next time if biometrics are available
            if (isBiometricAvailable) {
                await BiometricAuthService.saveCredentials(email.trim(), password);
            }

        } catch (e: any) {
            console.log('Login error:', e);
            if (e.message && e.message.includes('verificación')) {
                Alert.alert(
                    'Cuenta Pendiente de Verificación',
                    'Tu cuenta está siendo revisada. Una vez aceptado, obtendrás:\n\n' +
                    '✅ Acceso a clientes potenciales\n' +
                    '✅ Pagos seguros garantizados\n' +
                    '✅ Herramientas de gestión de casos\n\n' +
                    'Te notificaremos pronto.',
                    [{ text: 'Entendido', style: 'default' }]
                );
            } else {
                Alert.alert('Error', e.message || 'Credenciales inválidas o error de conexión');
            }
        } finally {
            setLocalLoading(false);
        }
    };

    const handleSocialLogin = async (provider: string) => {
        // ... (Social Login Logic remains same)
        try {
            setLocalLoading(true);
            const mockUid = 'firebase_uid_' + Math.random().toString(36).substr(2, 9);
            const mockEmail = `user_${Math.random().toString(36).substr(2, 5)}@example.com`;
            let role = await AsyncStorage.getItem('TEMP_ROLE_SELECTION');
            if (!role) role = 'worker';

            const API_URL = 'http://localhost:3000/api'; // Warning: This should be from constants

            const response = await fetch(`${API_URL}/auth/social-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: mockEmail,
                    uid: mockUid,
                    role: role,
                    name: `Usuario ${provider}`
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            Alert.alert('Éxito', `Login con ${provider} exitoso.`);

        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Ingresa tu correo', 'Por favor ingresa tu correo electrónico para restablecer tu contraseña');
            return;
        }
        try {
            const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
            Alert.alert('Correo Enviado', 'Revisa tu bandeja de entrada.');
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo enviar el correo.');
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[AppTheme?.colors?.primary || '#1e3799', '#3742fa']}
                style={styles.header}
            >
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/images/aliado_logo_new.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>Aliado Laboral</Text>
                <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
                <Text style={styles.versionTextHeader}>v1.19.1</Text>
            </LinearGradient>

            <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>

                {/* Biometric Button */}
                {isBiometricAvailable && hasStoredCredentials && (
                    <TouchableOpacity
                        style={styles.biometricButton}
                        onPress={handleBiometricLogin}
                        disabled={localLoading}
                    >
                        <Ionicons name="finger-print" size={32} color={AppTheme.colors.primary} />
                        <Text style={styles.biometricText}>Ingresar con Huella/Rostro</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    disabled={localLoading}
                >
                    <LinearGradient
                        colors={[AppTheme?.colors?.secondary || '#f6b93b', '#f9ca24']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        {localLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>O continúa con</Text>
                    <View style={styles.divider} />
                </View>

                <View style={styles.socialContainer}>
                    <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Google')}>
                        <Ionicons name="logo-google" size={24} color="#DB4437" />
                        <Text style={styles.socialButtonText}>Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialLogin('Facebook')}>
                        <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                        <Text style={styles.socialButtonText}>Facebook</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Welcome' as never)}>
                        <Text style={styles.registerLink}>Regístrate</Text>
                    </TouchableOpacity>
                </View>

                {/* DEV QUICK LOGIN - Only visible in DEV mode */}
                {__DEV__ && (
                    <View style={{ marginTop: 30, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
                        <Text style={{ textAlign: 'center', marginBottom: 10, fontWeight: 'bold', color: '#555' }}>
                            🛠️ ACCESO RÁPIDO (DEV)
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' }}>
                            <TouchableOpacity
                                style={{ backgroundColor: '#3498db', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('worker_premium@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>👷 Worker Prem</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: '#2c3e50', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('lawyer_basic@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>⚖️ Lawyer Basic</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: '#2c3e50', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('lawyer_pro@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>⚖️ Lawyer Pro</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: '#e67e22', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('pyme_basic@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>🏢 Pyme Basic</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: '#e67e22', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('pyme_premium@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>🏢 Pyme Prem</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ backgroundColor: '#c0392b', padding: 8, borderRadius: 5, margin: 2 }}
                                onPress={() => { setEmail('admin@test.com'); setPassword('123456'); }}
                            >
                                <Text style={{ color: 'white', fontSize: 10 }}>👑 Admin</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppTheme?.colors?.background || '#f1f2f6',
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 15,
    },

    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    versionTextHeader: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 5,
    },
    formContainer: {
        padding: 20,
        marginTop: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        color: AppTheme?.colors?.primary || '#1e3799',
        marginBottom: 20,
    },
    loginButton: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 30,
        shadowColor: AppTheme?.colors?.secondary || '#f6b93b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    gradientButton: {
        paddingVertical: 15,
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#888',
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        width: '48%',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    socialButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        color: '#666',
        fontSize: 16,
    },
    registerLink: {
        color: AppTheme?.colors?.primary || '#1e3799',
        fontSize: 16,
        fontWeight: 'bold',
    },
    testButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    testButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    testButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
    },
    versionContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    versionText: {
        color: '#ccc',
        fontSize: 12,
    },
    biometricButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    biometricText: {
        marginLeft: 10,
        fontSize: 16,
        color: AppTheme?.colors?.primary || '#1e3799',
        fontWeight: '600',
    },
});

export default LoginScreen;

