import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const clearNews = async () => {
    try {
        const deleted = await prisma.legalNews.deleteMany({});
        console.log(`✅ Deleted ${deleted.count} news items.`);
    } catch (error) {
        console.error('Error clearing news:', error);
    } finally {
        await prisma.$disconnect();
    }
};

clearNews();
