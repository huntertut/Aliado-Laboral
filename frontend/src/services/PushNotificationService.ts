import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return undefined;
    }

    // --- DIAGNOSTIC: get existing permission status ---
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('📲 [Push] Existing permission status:', existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        console.log('📲 [Push] Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📲 [Push] Permission after request:', finalStatus);
    }

    if (finalStatus !== 'granted') {
        // Return diagnostic string so AuthContext Alert can show exact status
        return `__DENIED__:existing=${existingStatus},final=${finalStatus}`;
    }

    // --- Get Expo Push Token ---
    try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId
            ?? Constants?.easConfig?.projectId
            ?? 'edbaa94d-8deb-4e42-9eae-b9d597dcf595';

        console.log('📲 [Push] Getting token with projectId:', projectId);
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('📲 [Push] Token obtained:', token);
    } catch (e: any) {
        const errMsg = e?.message || String(e);
        console.error('📲 [Push] Error getting token:', errMsg);
        return `__ERROR__:${errMsg}`;
    }

    return token;
};
