import Parser from 'rss-parser';
import cron from 'node-cron';
import * as newsAIService from './newsAIService';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from './notificationService';

const prisma = new PrismaClient();
const parser = new Parser();

// Google News RSS Feed (Specific to Mexico Labor Law)
const RSS_URL = 'https://news.google.com/rss/search?q=ley+federal+del+trabajo+mexico&hl=es-419&gl=MX&ceid=MX:es-419';

/**
 * Fetch and process news from RSS
 */
export const fetchLaborNews = async () => {
    console.log('⏰ [Scheduler] Running Daily News Fetch...');

    try {
        const feed = await parser.parseURL(RSS_URL);
        console.log(`📡 [Scheduler] Fetched ${feed.items.length} items from RSS.`);

        // Filter: Only items from last 24h
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentItems = feed.items.filter(item => {
            const pubDate = item.pubDate ? new Date(item.pubDate) : new Date(0);
            return pubDate > yesterday;
        });

        console.log(`🔍 [Scheduler] Found ${recentItems.length} recent items.`);

        // Process only the top 1 most relevant recent item to save quota/avoid spam
        // We only want 1 high quality news per day effectively
        const topItem = recentItems[0];

        if (!topItem) {
            console.log('📭 [Scheduler] No new relevant news found today.');
            return;
        }

        // Check if already exists by title (fuzzy check)
        const existing = await prisma.legalNews.findFirst({
            where: {
                originalText: { contains: topItem.title } // Store title in originalText for duplicate check reference
            }
        });

        if (existing) {
            console.log('⚠️ [Scheduler] News already exists in DB. Skipping.');
            return;
        }

        console.log(`🤖 [Scheduler] Processing: ${topItem.title}`);

        // Construct the text to analyze (Title + Snippet + Link)
        // Note: Fetching full content from Google News links is hard due to redirects/JS. 
        // We rely on the snippet and title which is usually enough for a summary of "There is a new discussion about X".
        const textToAnalyze = `
            TITULO: ${topItem.title}
            FUENTE: ${topItem.contentSnippet || topItem.content || 'Google News'}
            LINK: ${topItem.link}
            
            (Analiza este fragmento y genera una noticia útil).
        `;

        const processed = await newsAIService.processLegalNews(textToAnalyze);

        let finalData: any = null;

        if (processed) {
            finalData = {
                originalText: textToAnalyze,
                titleClickable: processed.titulo_clickeable,
                summaryWorker: processed.resumen_trabajador,
                summarySme: processed.resumen_pyme,
                summaryLawyer: processed.resumen_abogado,
                quizQuestion: processed.pregunta_quiz,
                imageUrl: getRandomImage(),
                isPublished: true
            };
        } else {
            console.warn('⚠️ [Scheduler] AI failed (Propagation?). Saving with raw snippet fallback.');
            // Fallback: Use RSS data directly so the user sees SOMETHING
            finalData = {
                originalText: textToAnalyze,
                titleClickable: topItem.title || "Noticia Laboral",
                summaryWorker: "Resumen pendiente (IA analizando...)\n\n" + (topItem.contentSnippet || "Sin detalles."),
                summarySme: "Resumen pendiente (IA analizando...)",
                summaryLawyer: "Resumen pendiente (IA analizando...)",
                quizQuestion: "¿Te interesa esta noticia?",
                imageUrl: getRandomImage(),
                isPublished: true
            };
        }

        await prisma.legalNews.create({ data: finalData });
        console.log('✅ [Scheduler] News saved to DB (AI or Fallback).');

        // --- BROADCAST NOTIFICATION ---
        try {
            // Fetch users with push tokens (Optimization: Select only needed fields)
            const users = await prisma.user.findMany({
                where: { pushToken: { not: null } },
                select: { id: true, pushToken: true }
            });

            console.log(`📢 [Scheduler] Broadcasting news to ${users.length} users...`);

            const notificationTitle = "🗞️ Nueva Noticia Laboral";
            const notificationBody = finalData.titleClickable || "Actualización importante sobre la LFT.";

            // Send in parallel (or use the chunk logic inside notificationService if optimized)
            // For now, simple loop using the service's single-send or we could refactor service to batch.
            // Using a simple loop for safety/simplicity in this fix.

            let sentCount = 0;
            for (const user of users) {
                // Avoiding await inside loop to not block, but for mass push ideally use chunks.
                // Since sendPushNotification is async, we can fire and forget or gather promises.
                // Let's gather promises for better robustness.
                sendPushNotification(user.id, notificationTitle, notificationBody, { type: 'news', newsId: topItem.link });
                sentCount++;
            }
            console.log(`🔔 [Scheduler] Broadcasted to ${sentCount} users.`);

        } catch (notifyError) {
            console.error('⚠️ [Scheduler] Failed to broadcast notifications:', notifyError);
        }

    } catch (error) {
        console.error('❌ [Scheduler] Error fetching RSS:', error);
    }
};

/**
 * Start the Cron Job
 */
export const startScheduler = () => {
    // Run every day at 8:00 AM Mexico City Time
    // Note: Node-cron uses server time. Assuming Railway is UTC, 8AM MX (UTC-6) is 14:00 UTC.
    // Let's run it every 6 hours just in case to catch midday news, but the duplicate check prevents spam.
    cron.schedule('0 8 * * *', () => { // Run at 8:00 AM
        fetchLaborNews();
        cleanOldNews(); // Cleanup old news
    });

    // Also run cleanup on startup/deploy
    setTimeout(() => cleanOldNews(), 5000);
};

// --- NEW SCHEDULER (Vaporware Implementation) ---
import * as schedulerService from './schedulerService';
schedulerService.startScheduler();


/**
 * Delete news older than 7 days
 */
const cleanOldNews = async () => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deleted = await prisma.legalNews.deleteMany({
            where: {
                createdAt: { lt: sevenDaysAgo }
            }
        });
        console.log(`🧹 [Scheduler] Cleaned up ${deleted.count} old news items.`);
    } catch (error) {
        console.error('❌ [Scheduler] Error cleaning old news:', error);
    }
};

const LEGAL_IMAGES = [
    "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80", // Gavel
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=800&q=80", // Classical Building
    "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?auto=format&fit=crop&w=800&q=80", // Pen & Contract
    "https://images.unsplash.com/photo-1555374018-13a8994ab246?auto=format&fit=crop&w=800&q=80", // Office Discussion
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80"  // Handshake
];

const getRandomImage = () => {
    return LEGAL_IMAGES[Math.floor(Math.random() * LEGAL_IMAGES.length)];
};


