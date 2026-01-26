import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config/constants';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// Helper: Register Token in Backend
const registerTokenInBackend = async (token: string) => {
    try {
        const authToken = await AsyncStorage.getItem('userToken');
        if (!authToken) return;

        await axios.post(`${API_URL}/notifications/register-token`, {
            token,
            platform: Platform.OS
        }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log('✅ Push Token registrado en backend:', token);
    } catch (error) {
        console.log('⚠️ Error registrando token (Backend offline?):', error);
    }
};

export const useNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');
    const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
    const notificationListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    // 1. Register for Push Notifications
    const registerForPushNotificationsAsync = async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('❌ Permiso de notificaciones denegado.');
                return;
            }

            try {
                // Get Expo Push Token
                const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: projectId,
                })).data;

                console.log('📲 Expo Push Token Local:', token);
            } catch (e) {
                console.error('Error obteniendo Expo Token:', e);
            }
        } else {
            console.log('⚠️ Debes usar un dispositivo físico para Push Notifications.');
        }

        return token;
    };

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            setExpoPushToken(token);
            if (token) registerTokenInBackend(token);
        });

        // 2. Foreground Listener
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
            console.log("🔔 Notificación en Primer Plano:", notification);
        });

        // 3. Background/Interaction Listener (Tap on notification)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log("👆 Usuario tocó la notificación:", response);
            // Here you can handle navigation based on response.notification.request.content.data
        });

        return () => {
            if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
            if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return { expoPushToken, notification };
};

