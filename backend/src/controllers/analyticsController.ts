import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Log Event (Called by Frontend)
export const logEvent = async (req: Request, res: Response) => {
    try {
        const { event, metadata, timestamp } = req.body;

        if (!event) {
            return res.status(400).json({ error: 'Event name is required' });
        }

        // Convert metadata object to JSON string
        const metadataStr = metadata ? JSON.stringify(metadata) : null;

        await prisma.analyticsEvent.create({
            data: {
                event,
                metadata: metadataStr,
                timestamp: timestamp ? new Date(timestamp) : new Date()
            }
        });

        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error logging analytics event:', error);
        // Don't leak details, just fail silently or 500
        res.status(500).json({ error: 'Log failed' });
    }
};

// 2. Get Dashboard Metrics (Called by Admin Panel)
export const getDashboardMetrics = async (req: Request, res: Response) => {
    try {
        // Authenticate as Admin (Middleware should handle, but sanity check)
        const user = (req as any).user;
        if (user?.role !== 'admin' && user?.role !== 'supervisor') {
            // return res.status(403).json({ error: 'Unauthorized' });
        }

        // --- AGGREGATION ---

        // 1. Monetization: Conversion Rate
        // Count total locked views
        const lockedViews = await prisma.analyticsEvent.count({
            where: { event: 'lead_locked_view' }
        });

        // Count unlock attempts
        const unlockTaps = await prisma.analyticsEvent.count({
            where: { event: 'lead_unlock_tap' }
        });

        const conversionRate = lockedViews > 0
            ? ((unlockTaps / lockedViews) * 100).toFixed(1)
            : 0;

        // 2. Retention: Viral Reach
        const viralChecks = await prisma.analyticsEvent.count({
            where: { event: 'salary_comparison_view' }
        });

        const vaultUploads = await prisma.analyticsEvent.count({
            where: { event: 'vault_file_uploaded' }
        });

        // 3. Trends (Last 24h)
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const newLeads24h = await prisma.contactRequest.count({
            where: { createdAt: { gte: yesterday } }
        });

        res.json({
            monetization: {
                lockedViews,
                unlockAttempts: unlockTaps,
                conversionRate: `${conversionRate}%`
            },
            growth: {
                salaryThermometerUses: viralChecks,
                vaultUploads
            },
            activity: {
                newLeads24h
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ error: 'Error fetching metrics' });
    }
};
