import { useEffect, useState } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import axios from 'axios';

// Function to register the token in the backend
const registerTokenInBackend = async (token: string) => {
    try {
        const authToken = await AsyncStorage.getItem('userToken'); // Use key consistent with AuthContext
        if (!authToken) {
            console.log('No auth token found, skipping FCM token registration');
            return;
        }

        // Ideally, this endpoint needs to be created in the backend
        await axios.post(`${API_URL}/notifications/register-token`, {
            token,
            platform: Platform.OS
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ FCM Token registered in backend');
    } catch (error) {
        console.log('⚠️ Error registering FCM token (Backend might not be ready yet):', error);
    }
};

export const useNotifications = () => {
    const [permissionStatus, setPermissionStatus] = useState<any>(null);

    // 1. Request Permission
    const requestUserPermission = async () => {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            setPermissionStatus(authStatus);

            if (enabled) {
                console.log('Authorization status:', authStatus);
                getToken();
            }
        } catch (error) {
            console.log('Error requesting permission:', error);
        }
    };

    // 2. Get Token
    const getToken = async () => {
        try {
            // Check if we already have a token
            const token = await messaging().getToken();
            if (token) {
                console.log('FCM Token:', token);
                await registerTokenInBackend(token);
            }
        } catch (error) {
            console.log('Error getting FCM Token:', error);
        }
    };

    useEffect(() => {
        requestUserPermission();

        // Listener for token refresh
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
            registerTokenInBackend(token);
        });

        // Listener for foreground notifications
        const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
            Alert.alert(
                remoteMessage.notification?.title || 'Nueva Notificación',
                remoteMessage.notification?.body
            );
        });

        return () => {
            unsubscribeTokenRefresh();
            unsubscribeForeground();
        };
    }, []);

    return { permissionStatus };
};
