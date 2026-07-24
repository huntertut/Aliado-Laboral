
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let versionCache: { data: any; expiry: number } | null = null;

export const clearVersionCache = () => {
    versionCache = null;
};

// Endpoint /api/config/version (consumido por la App Móvil)
export const getVersionConfig = async (req: Request, res: Response) => {
    const now = Date.now();
    if (versionCache && versionCache.expiry > now) {
        return res.json(versionCache.data);
    }

    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: { in: ['MIN_VERSION_ANDROID', 'MIN_VERSION_IOS', 'UPDATE_URL_ANDROID', 'UPDATE_URL_IOS'] }
            }
        });

        const configMap: Record<string, string> = {};
        configs.forEach(c => configMap[c.key] = c.value);

        const data = {
            min_version_android: configMap['MIN_VERSION_ANDROID'] || process.env.MIN_VERSION_ANDROID || '1.3.1',
            min_version_ios: configMap['MIN_VERSION_IOS'] || process.env.MIN_VERSION_IOS || '1.20.0',
            update_url_android: configMap['UPDATE_URL_ANDROID'] || 'market://details?id=com.aliadolaboral.app',
            update_url_ios: configMap['UPDATE_URL_IOS'] || 'itms-apps://itunes.apple.com/app/id0000000000'
        };

        versionCache = { data, expiry: now + 60 * 1000 }; // 60 segundos de caché
        res.json(data);
    } catch (error) {
        console.error('Error fetching version config from DB:', error);
        res.json({
            min_version_android: process.env.MIN_VERSION_ANDROID || '1.3.1',
            min_version_ios: process.env.MIN_VERSION_IOS || '1.20.0',
            update_url_android: 'market://details?id=com.aliadolaboral.app',
            update_url_ios: 'itms-apps://itunes.apple.com/app/id0000000000'
        });
    }
};

// Public/Admin: Obtener configuración completa (Promociones + Versiones Móviles)
export const getPublicConfig = async (req: Request, res: Response) => {
    try {
        const configs = await prisma.systemConfig.findMany({
            where: {
                key: {
                    in: [
                        'PROMO_LAWYER_TRIAL_DAYS',
                        'PROMO_IS_ACTIVE',
                        'PROMO_BANNER_TEXT',
                        'MIN_VERSION_ANDROID',
                        'MIN_VERSION_IOS',
                        'UPDATE_URL_ANDROID',
                        'UPDATE_URL_IOS'
                    ]
                }
            }
        });

        const configMap: Record<string, string> = {};
        configs.forEach(c => configMap[c.key] = c.value);

        const response = {
            promoActive: configMap['PROMO_IS_ACTIVE'] === 'true',
            trialDays: parseInt(configMap['PROMO_LAWYER_TRIAL_DAYS'] || '0'),
            bannerText: configMap['PROMO_BANNER_TEXT'] || "¡Promoción Especial!",
            minVersionAndroid: configMap['MIN_VERSION_ANDROID'] || process.env.MIN_VERSION_ANDROID || '1.3.1',
            minVersionIos: configMap['MIN_VERSION_IOS'] || process.env.MIN_VERSION_IOS || '1.20.0',
            updateUrlAndroid: configMap['UPDATE_URL_ANDROID'] || 'market://details?id=com.aliadolaboral.app',
            updateUrlIos: configMap['UPDATE_URL_IOS'] || 'itms-apps://itunes.apple.com/app/id0000000000'
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching public config:', error);
        res.status(500).json({ error: 'Internal error' });
    }
};

// Admin: Actualizar configuración (Promociones + Versiones Móviles)
export const updateConfig = async (req: Request, res: Response) => {
    try {
        const {
            promoActive,
            trialDays,
            bannerText,
            minVersionAndroid,
            minVersionIos,
            updateUrlAndroid,
            updateUrlIos
        } = req.body;

        const transactions: any[] = [];

        if (promoActive !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'PROMO_IS_ACTIVE' },
                update: { value: String(promoActive) },
                create: { key: 'PROMO_IS_ACTIVE', value: String(promoActive), description: 'Enable/Disable Lawyer Promo' }
            }));
        }

        if (trialDays !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'PROMO_LAWYER_TRIAL_DAYS' },
                update: { value: String(trialDays) },
                create: { key: 'PROMO_LAWYER_TRIAL_DAYS', value: String(trialDays), description: 'Days of free trial' }
            }));
        }

        if (bannerText !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'PROMO_BANNER_TEXT' },
                update: { value: String(bannerText) },
                create: { key: 'PROMO_BANNER_TEXT', value: String(bannerText), description: 'Text to show in banner' }
            }));
        }

        if (minVersionAndroid !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'MIN_VERSION_ANDROID' },
                update: { value: String(minVersionAndroid) },
                create: { key: 'MIN_VERSION_ANDROID', value: String(minVersionAndroid), description: 'Versión mínima requerida Android' }
            }));
        }

        if (minVersionIos !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'MIN_VERSION_IOS' },
                update: { value: String(minVersionIos) },
                create: { key: 'MIN_VERSION_IOS', value: String(minVersionIos), description: 'Versión mínima requerida iOS' }
            }));
        }

        if (updateUrlAndroid !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'UPDATE_URL_ANDROID' },
                update: { value: String(updateUrlAndroid) },
                create: { key: 'UPDATE_URL_ANDROID', value: String(updateUrlAndroid), description: 'URL de actualización Play Store' }
            }));
        }

        if (updateUrlIos !== undefined) {
            transactions.push(prisma.systemConfig.upsert({
                where: { key: 'UPDATE_URL_IOS' },
                update: { value: String(updateUrlIos) },
                create: { key: 'UPDATE_URL_IOS', value: String(updateUrlIos), description: 'URL de actualización App Store' }
            }));
        }

        if (transactions.length > 0) {
            await prisma.$transaction(transactions);
            clearVersionCache();
        }

        res.json({ success: true, message: 'Configuración actualizada correctamente' });
    } catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Internal admin error' });
    }
};

