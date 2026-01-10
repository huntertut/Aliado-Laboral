import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaClient } from '@prisma/client';

const expo = new Expo();
const prisma = new PrismaClient();

export const sendPushNotification = async (userId: string, title: string, body: string, data: any = {}) => {
    try {
        // 1. Get User Push Token
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true }
        });

        if (!user || !user.pushToken) {
            console.log(`🔕 User ${userId} has no push token.`);
            return false;
        }

        if (!Expo.isExpoPushToken(user.pushToken)) {
            console.error(`❌ Push token ${user.pushToken} is not a valid Expo push token`);
            return false;
        }

        // 2. Construct Message
        const messages: ExpoPushMessage[] = [{
            to: user.pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
        }];

        // 3. Send
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log('🔔 Push Sent:', ticketChunk);
            } catch (error) {
                console.error('Error sending push chunk:', error);
            }
        }

        return true;

    } catch (error) {
        console.error('Error in validPushNotification:', error);
        return false;
    }
};
