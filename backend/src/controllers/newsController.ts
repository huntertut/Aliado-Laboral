import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as newsAIService from '../services/newsAIService';
import { fetchLaborNews } from '../services/newsScheduler';
import { SocialService } from '../services/SocialService';
import { ImageGeneratorService } from '../services/imageGenerator';

const prisma = new PrismaClient();

/**
 * ADMIN: Manually trigger news fetch (bypass cron)
 */
export const triggerNewsFetch = async (req: Request, res: Response) => {
    try {
        console.log('👆 Admin triggered manual news fetch.');
        await fetchLaborNews();
        res.json({ message: 'Búsqueda de noticias ejecutada. Revisa los logs o el feed.' });
    } catch (error) {
        console.error('Error triggering news:', error);
        res.status(500).json({ error: 'Error al ejecutar el trigger' });
    }
};

/**
 * ADMIN: Create news entry using AI processing
 */
export const createNews = async (req: Request, res: Response) => {
    try {
        const { originalText, imageUrl } = req.body;

        if (!originalText || originalText.length < 20) {
            return res.status(400).json({ error: 'El texto de la noticia es muy corto' });
        }

        // 1. Process with Google AI
        const aiResult = await newsAIService.processLegalNews(originalText);

        if (!aiResult) {
            return res.status(500).json({ error: 'La IA no pudo procesar la noticia en este momento' });
        }

        // 1.5. Generate Visual (Bannerbear/Mock)
        let finalImageUrl = imageUrl;
        if (!finalImageUrl) {
            finalImageUrl = await ImageGeneratorService.generateNewsImage({
                title: aiResult.titulo_clickeable,
                summary: aiResult.resumen_pyme, // Business focus for image text often works better
                category: 'Actualidad Laboral',
                date: new Date().toLocaleDateString('es-MX')
            });
        }

        // 2. Save to database
        const news = await prisma.legalNews.create({
            data: {
                originalText,
                imageUrl: finalImageUrl,
                titleClickable: aiResult.titulo_clickeable,
                summaryWorker: aiResult.resumen_trabajador,
                summarySme: aiResult.resumen_pyme,
                summaryLawyer: aiResult.resumen_abogado,
                quizQuestion: aiResult.pregunta_quiz,
                isPublished: true
            }
        });

        // 3. Broadcast to Social Media (Async)
        SocialService.broadcastNewsToSocialMedia({
            title: news.titleClickable,
            summary: news.summaryLawyer, // Use professional summary for LinkedIn
            category: 'Legal',
            url: `https://aliadolaboral.com/news/${news.id}`, // Mock URL
            processedAt: news.createdAt
        });

        res.status(201).json({
            message: 'Noticia creada, procesada y difundida con éxito',
            news
        });

    } catch (error) {
        console.error('Error in createNews:', error);
        res.status(500).json({ error: 'Error interno al crear noticia' });
    }
};

/**
 * PUBLIC/USER: Get adaptive news feed
 */
export const getNewsFeed = async (req: any, res: Response) => {
    try {
        const userRole = req.user?.role || 'worker'; // Default to worker if not authenticated (public)

        const newsItems = await prisma.legalNews.findMany({
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        if (newsItems.length === 0) {
            // Fallback for empty state
            return res.json([{
                id: 'welcome-news',
                title: 'Bienvenido a Aliado Laboral',
                summary: 'Mantente informado sobre las últimas noticias laborales, cambios en la ley y consejos para proteger tus derechos. ¡Pronto verás más contenido aquí!',
                imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                quiz: '¿Sabías que tienes derecho a aguinaldo antes del 20 de diciembre?',
                createdAt: new Date(),
                roleContext: userRole
            }]);
        }

        // Format summaries based on role
        const formattedNews = newsItems.map(item => {
            let summary = item.summaryWorker;

            if (userRole === 'lawyer') {
                summary = item.summaryLawyer;
            } else if (userRole === 'admin') {
                summary = item.summarySme; // Admins see SME/Business perspective
            }

            return {
                id: item.id,
                title: item.titleClickable,
                summary,
                imageUrl: item.imageUrl,
                quiz: item.quizQuestion,
                createdAt: item.createdAt,
                roleContext: userRole
            };
        });

        res.json(formattedNews);

    } catch (error) {
        console.error('Error in getNewsFeed:', error);
        res.status(500).json({ error: 'Error al obtener noticias' });
    }
};

/**
 * ADMIN: Delete news
 */
export const deleteNews = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.legalNews.delete({ where: { id } });
        res.json({ message: 'Noticia eliminada' });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo eliminar la noticia' });
    }
};
