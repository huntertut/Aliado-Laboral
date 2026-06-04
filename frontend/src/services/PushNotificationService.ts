import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    let token;

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
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
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const projectId = Constants?.expoConfig?.extra?.eas?.projectId 
                ?? Constants?.easConfig?.projectId
                ?? 'edbaa94d-8deb-4e42-9eae-b9d597dcf595'; // Hardcoded fallback
            
            console.log('📲 [Push] Requesting token with projectId:', projectId);

            token = (await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            })).data;

            console.log('📲 Expo Push Token:', token);
        } catch (e: any) {
            console.error('Error getting push token:', e?.message || e);
        }

    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
};
