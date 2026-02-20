import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checkStatus = async () => {
    console.log('🔍 Checking System Status...');

    try {
        // 1. Check Latest News
        const latestNews = await prisma.legalNews.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        if (latestNews) {
            console.log('✅ Latest News found:');
            console.log(`- ID: ${latestNews.id}`);
            console.log(`- Title: ${latestNews.titleClickable}`);
            console.log(`- Date: ${latestNews.createdAt.toISOString()}`);
            console.log(`- Image: ${latestNews.imageUrl}`);
        } else {
            console.log('❌ No news found in database.');
        }

        // 2. Check User Count with Push Token
        const userCount = await prisma.user.count({
            where: { pushToken: { not: null } }
        });
        console.log(`👥 Users with Push Tokens: ${userCount}`);

    } catch (error) {
        console.error('Error checking status:', error);
    } finally {
        await prisma.$disconnect();
    }
};

checkStatus();
