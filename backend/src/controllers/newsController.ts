import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as newsAIService from '../services/newsAIService';

const prisma = new PrismaClient();

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

        // 2. Save to database
        const news = await prisma.legalNews.create({
            data: {
                originalText,
                imageUrl,
                titleClickable: aiResult.titulo_clickeable,
                summaryWorker: aiResult.resumen_trabajador,
                summarySme: aiResult.resumen_pyme,
                summaryLawyer: aiResult.resumen_abogado,
                quizQuestion: aiResult.pregunta_quiz,
                isPublished: true
            }
        });

        res.status(201).json({
            message: 'Noticia creada y procesada con éxito',
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
