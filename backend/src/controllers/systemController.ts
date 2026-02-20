
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Public: Get active promotions
export const getPublicConfig = async (req: Request, res: Response) => {
    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['PROMO_LAWYER_TRIAL_DAYS', 'PROMO_IS_ACTIVE', 'PROMO_BANNER_TEXT'] }
            }
        });

        // Transform array to object for easier frontend consumption
        const configMap: any = {};
        configs.forEach(c => configMap[c.key] = c.value);

        // Defaults if not found
        const response = {
            promoActive: configMap['PROMO_IS_ACTIVE'] === 'true',
            trialDays: parseInt(configMap['PROMO_LAWYER_TRIAL_DAYS'] || '0'),
            bannerText: configMap['PROMO_BANNER_TEXT'] || "¡Promoción Especial!"
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching public config:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

// Admin: Update config
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { promoActive, trialDays, bannerText } = req.body;

        await prisma.$transaction([
            prisma.systemConfig.upsert({
                where: { key: 'PROMO_IS_ACTIVE' },
                update: { value: String(promoActive) },
                create: { key: 'PROMO_IS_ACTIVE', value: String(promoActive), description: 'Enable/Disable Lawyer Promo' }
            }),
            prisma.systemConfig.upsert({
                where: { key: 'PROMO_LAWYER_TRIAL_DAYS' },
                update: { value: String(trialDays) },
                create: { key: 'PROMO_LAWYER_TRIAL_DAYS', value: String(trialDays), description: 'Days of free trial' }
            }),
            prisma.systemConfig.upsert({
                where: { key: 'PROMO_BANNER_TEXT' },
                update: { value: bannerText },
                create: { key: 'PROMO_BANNER_TEXT', value: bannerText, description: 'Text to show in banner' }
            })
        ]);

        res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Internal admin error' });
    }
};
