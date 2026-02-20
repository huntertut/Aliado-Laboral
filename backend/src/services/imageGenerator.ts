import axios from 'axios';

interface BannerbearTemplateData {
    title: string;
    summary: string;
    category?: string;
    date?: string;
}

export const ImageGeneratorService = {
    /**
     * Generates a social media image using Bannerbear (or mock).
     * @param data - The text data to inject into the template.
     * @returns The URL of the generated image.
     */
    generateNewsImage: async (data: BannerbearTemplateData): Promise<string> => {
        const BANNERBEAR_API_KEY = process.env.BANNERBEAR_API_KEY;
        const TEMPLATE_ID = process.env.BANNERBEAR_TEMPLATE_ID || 'mock-template-id';

        console.log(`🎨 [ImageGenerator] Generating image for: "${data.title}"...`);

        // IF NO KEY, RETURN MOCK (UNSPLASH)
        if (!BANNERBEAR_API_KEY) {
            console.warn('⚠️ [ImageGenerator] No API Key found. Using mock image.');
            // Return a professional-looking legal/business placeholder from Unsplash
            // Using a query related to "law" or "business"
            return `https://source.unsplash.com/random/800x600/?law,business,office&sig=${Date.now()}`;
        }

        try {
            // REAL API CALL
            const response = await axios.post(
                'https://api.bannerbear.com/v2/images',
                {
                    template: TEMPLATE_ID,
                    modifications: [
                        {
                            name: "title_text",
                            text: data.title
                        },
                        {
                            name: "summary_text",
                            text: data.summary.substring(0, 100) + "..." // Truncate
                        },
                        {
                            name: "category_badge",
                            text: data.category || "NOTICIA LEGAL"
                        },
                        {
                            name: "date_text",
                            text: data.date || new Date().toLocaleDateString('es-MX')
                        }
                    ]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${BANNERBEAR_API_KEY}`
                    }
                }
            );

            const imageUrl = response.data?.image_url;
            console.log('✅ [ImageGenerator] Image created:', imageUrl);
            return imageUrl;

        } catch (error: any) {
            console.error('❌ [ImageGenerator] API Failed:', error.response?.data || error.message);
            // Fallback to mock on error
            return `https://source.unsplash.com/random/800x600/?error,abstract&sig=${Date.now()}`;
        }
    }
};
