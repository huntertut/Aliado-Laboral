import axios from 'axios';

interface NewsSummary {
    title: string;
    summary: string;
    category: string;
    url: string;
    processedAt: Date;
}

export const SocialService = {
    /**
     * Sends a processed news summary to the external marketing webhook (e.g., Zapier/Make).
     * This allows the marketing team to auto-post to LinkedIn/Twitter/Instagram.
     */
    broadcastNewsToSocialMedia: async (news: NewsSummary) => {
        const WEBHOOK_URL = process.env.SOCIAL_MEDIA_WEBHOOK_URL;

        if (!WEBHOOK_URL) {
            console.warn('⚠️ [SocialService] SOCIAL_MEDIA_WEBHOOK_URL not defined. Skipping broadcast.');
            return;
        }

        try {
            console.log(`📡 [SocialService] Broadcasting news: "${news.title}"...`);

            await axios.post(WEBHOOK_URL, {
                event: 'news.published',
                data: {
                    title: news.title,
                    content: news.summary,
                    category: news.category,
                    link: news.url,
                    timestamp: news.processedAt.toISOString(),
                    // Tono "Aliado Laboral": Profesional pero accesible
                    hashtags: ['#DerechosLaborales', '#AliadoLaboral', '#AbogadosMexico', '#JusticiaLaboral']
                }
            });

            console.log('✅ [SocialService] Broadcast success!');
        } catch (error: any) {
            console.error('❌ [SocialService] Broadcast failed:', error.message);
            // Non-blocking failure
        }
    }
};
