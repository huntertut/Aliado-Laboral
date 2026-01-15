import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const SECURE_KEY_EMAIL = 'biometric_email';
const SECURE_KEY_PASSWORD = 'biometric_password'; // Warning: Storing password locally has risks, but is common for simple biome-login. Better to store a refresh token if possible.

export const BiometricAuthService = {
    /**
     * Checks if the device has biometric hardware and if it's enrolled.
     */
    checkAvailability: async (): Promise<{ hasHardware: boolean; isEnrolled: boolean; type: LocalAuthentication.AuthenticationType[] }> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const type = await LocalAuthentication.supportedAuthenticationTypesAsync();

        return { hasHardware, isEnrolled, type };
    },

    /**
     * Triggers the native biometric prompt.
     * Returns true if authentication was successful.
     */
    authenticate: async (): Promise<boolean> => {
        try {
            const availability = await BiometricAuthService.checkAvailability();

            if (!availability.hasHardware) {
                Alert.alert('Error', 'Tu dispositivo no soporta autenticación biométrica.');
                return false;
            }

            if (!availability.isEnrolled) {
                Alert.alert('Error', 'No tienes huellas o rostro configurado en este dispositivo.');
                return false;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Inicia sesión con tu Huella o Rostro',
                fallbackLabel: 'Usar Contraseña',
                cancelLabel: 'Cancelar',
                disableDeviceFallback: false,
            });

            if (result.success) {
                return true;
            } else {
                if (result.error !== 'user_cancel') {
                    console.log('Biometric failed:', result.error);
                }
                return false;
            }
        } catch (error) {
            console.error('Biometric Auth Error:', error);
            return false;
        }
    },

    /**
     * Securely saves user credentials for future biometric login.
     */
    saveCredentials: async (email: string, password: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(SECURE_KEY_EMAIL, email);
            await SecureStore.setItemAsync(SECURE_KEY_PASSWORD, password);
            console.log('[Biometric] Credentials secured.');
        } catch (error) {
            console.error('[Biometric] Error saving credentials:', error);
            throw error;
        }
    },

    /**
     * Retrieves credentials if biometric auth succeeds.
     */
    getCredentials: async (): Promise<{ email: string | null; password: string | null }> => {
        try {
            const email = await SecureStore.getItemAsync(SECURE_KEY_EMAIL);
            const password = await SecureStore.getItemAsync(SECURE_KEY_PASSWORD);
            return { email, password };
        } catch (error) {
            console.error('[Biometric] Error retrieving credentials:', error);
            return { email: null, password: null };
        }
    },

    /**
     * Clears stored credentials (e.g. on logout or disable).
     */
    clearCredentials: async (): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(SECURE_KEY_EMAIL);
            await SecureStore.deleteItemAsync(SECURE_KEY_PASSWORD);
            console.log('[Biometric] Credentials cleared.');
        } catch (error) {
            console.error('[Biometric] Error clearing credentials:', error);
        }
    }
};
