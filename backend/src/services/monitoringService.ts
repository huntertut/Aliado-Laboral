import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();
const expo = new Expo();

export interface MonitorCheckResult {
    id: string;
    name: string;
    status: 'ok' | 'warning' | 'critical';
    message: string;
    detail?: any;
}

export interface MonitoringReport {
    runAt: string;
    overallStatus: 'ok' | 'warning' | 'critical';
    checks: MonitorCheckResult[];
    alertsCreated: number;
}

/**
 * Runs all 8 automated health checks and records AdminAlerts for any issues found.
 * Called daily by cron at 8 AM and manually from the Admin Web.
 */
export const runDailyHealthCheck = async (): Promise<MonitoringReport> => {
    console.log('🔍 [Monitor] Starting daily health check...');
    const checks: MonitorCheckResult[] = [];
    let alertsCreated = 0;
    const now = new Date();

    // ─────────────────────────────────────────────────────────────────
    // M1: Usuarios registrados SIN token push
    // ─────────────────────────────────────────────────────────────────
    try {
        const totalUsers = await prisma.user.count({ where: { isBlocked: false } });
        const usersWithToken = await prisma.user.count({
            where: { pushToken: { not: null }, isBlocked: false }
        });
        const usersWithoutToken = totalUsers - usersWithToken;
        const coveragePct = totalUsers > 0 ? Math.round((usersWithToken / totalUsers) * 100) : 0;

        const status = coveragePct >= 70 ? 'ok' : coveragePct >= 40 ? 'warning' : 'critical';
        const message = `${usersWithToken}/${totalUsers} usuarios con push token registrado (${coveragePct}% cobertura).`;

        if (status !== 'ok') {
            await createAlert('M1_NO_PUSH_TOKEN', message, status === 'critical' ? 'high' : 'medium');
            alertsCreated++;
        }

        checks.push({ id: 'M1', name: 'Cobertura Push Token', status, message, detail: { totalUsers, usersWithToken, usersWithoutToken, coveragePct } });
    } catch (err: any) {
        checks.push({ id: 'M1', name: 'Cobertura Push Token', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M2: Tokens con cadena de error en BD
    // ─────────────────────────────────────────────────────────────────
    try {
        const usersWithErrorToken = await prisma.user.findMany({
            where: {
                pushToken: { not: null }
            },
            select: { id: true, email: true, pushToken: true }
        });

        const errorTokenUsers = usersWithErrorToken.filter(u =>
            u.pushToken && (u.pushToken.startsWith('__ERROR__') || u.pushToken.startsWith('__DENIED__') || !Expo.isExpoPushToken(u.pushToken))
        );

        if (errorTokenUsers.length > 0) {
            // Auto-purge
            for (const u of errorTokenUsers) {
                await prisma.user.update({ where: { id: u.id }, data: { pushToken: null } });
            }
            const msg = `Auto-purgados ${errorTokenUsers.length} tokens de error/formato inválido: ${errorTokenUsers.map(u => u.email).join(', ')}`;
            await createAlert('M2_INVALID_TOKENS', msg, 'medium');
            alertsCreated++;
            checks.push({ id: 'M2', name: 'Tokens de Error', status: 'warning', message: msg, detail: { count: errorTokenUsers.length, emails: errorTokenUsers.map(u => u.email) } });
        } else {
            checks.push({ id: 'M2', name: 'Tokens de Error', status: 'ok', message: 'No se encontraron tokens de error o formato inválido.', detail: { count: 0 } });
        }
    } catch (err: any) {
        checks.push({ id: 'M2', name: 'Tokens de Error', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M3: Noticias RSS — última ejecución exitosa (< 24h)
    // ─────────────────────────────────────────────────────────────────
    try {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentNews = await prisma.legalNews.findFirst({
            where: { createdAt: { gte: yesterday } },
            orderBy: { createdAt: 'desc' }
        });

        if (!recentNews) {
            const msg = 'No se ha publicado ninguna noticia jurídica en las últimas 24 horas. El cron de RSS puede haber fallado.';
            await createAlert('M3_RSS_CRON_FAILURE', msg, 'high');
            alertsCreated++;
            checks.push({ id: 'M3', name: 'Cron Noticias RSS', status: 'critical', message: msg });
        } else {
            checks.push({ id: 'M3', name: 'Cron Noticias RSS', status: 'ok', message: `Última noticia publicada: "${recentNews.titleClickable}" hace ${Math.round((now.getTime() - recentNews.createdAt.getTime()) / 60000)} minutos.`, detail: { lastNewsId: recentNews.id, lastNewsAt: recentNews.createdAt } });
        }
    } catch (err: any) {
        checks.push({ id: 'M3', name: 'Cron Noticias RSS', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M4: Membresías de abogados próximas a vencer (≤ 7 días)
    // ─────────────────────────────────────────────────────────────────
    try {
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringLawyers = await prisma.lawyerSubscription.findMany({
            where: {
                status: 'active',
                endDate: { gte: now, lte: sevenDaysFromNow }
            },
            include: {
                lawyer: { include: { user: { select: { email: true, fullName: true } } } }
            }
        });

        if (expiringLawyers.length > 0) {
            const names = expiringLawyers.map(s => `${s.lawyer.user?.fullName || s.lawyer.user?.email} (vence ${s.endDate?.toLocaleDateString('es-MX')})`).join(', ');
            const msg = `${expiringLawyers.length} membresía(s) de abogado vencen en los próximos 7 días: ${names}`;
            await createAlert('M4_SUBSCRIPTIONS_EXPIRING', msg, 'medium');
            alertsCreated++;
            checks.push({ id: 'M4', name: 'Membresías por Vencer', status: 'warning', message: msg, detail: { count: expiringLawyers.length } });
        } else {
            checks.push({ id: 'M4', name: 'Membresías por Vencer', status: 'ok', message: 'No hay membresías de abogados por vencer en los próximos 7 días.' });
        }
    } catch (err: any) {
        checks.push({ id: 'M4', name: 'Membresías por Vencer', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M5: Abogados verificados SIN token push (no reciben casos)
    // ─────────────────────────────────────────────────────────────────
    try {
        const verifiedLawyersWithoutToken = await prisma.lawyer.findMany({
            where: {
                isVerified: true,
                status: 'ACTIVE',
                user: { pushToken: null }
            },
            include: { user: { select: { email: true, fullName: true } } }
        });

        if (verifiedLawyersWithoutToken.length > 0) {
            const names = verifiedLawyersWithoutToken.slice(0, 5).map(l => l.user?.email).join(', ');
            const msg = `${verifiedLawyersWithoutToken.length} abogado(s) verificado(s) SIN token push (no recibirán alertas de casos): ${names}${verifiedLawyersWithoutToken.length > 5 ? '...' : ''}`;
            await createAlert('M5_LAWYERS_NO_TOKEN', msg, 'high');
            alertsCreated++;
            checks.push({ id: 'M5', name: 'Abogados Sin Push', status: 'warning', message: msg, detail: { count: verifiedLawyersWithoutToken.length, lawyers: verifiedLawyersWithoutToken.map(l => ({ email: l.user?.email, name: l.user?.fullName })) } });
        } else {
            checks.push({ id: 'M5', name: 'Abogados Sin Push', status: 'ok', message: 'Todos los abogados verificados activos tienen push token registrado.' });
        }
    } catch (err: any) {
        checks.push({ id: 'M5', name: 'Abogados Sin Push', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M6: Sincronización Firebase Auth vs SQL (diferencia > 5 usuarios)
    // ─────────────────────────────────────────────────────────────────
    try {
        const { default: admin } = await import('firebase-admin');
        const listResult = await admin.auth().listUsers(1000);
        const firebaseCount = listResult.users.length;
        const sqlCount = await prisma.user.count();
        const diff = Math.abs(firebaseCount - sqlCount);

        if (diff > 5) {
            const msg = `Desincronización: Firebase tiene ${firebaseCount} usuarios, SQL tiene ${sqlCount} (diferencia de ${diff}). Ejecuta "Sincronizar Firebase" desde el Admin Web.`;
            await createAlert('M6_FIREBASE_SYNC', msg, diff > 15 ? 'high' : 'medium');
            alertsCreated++;
            checks.push({ id: 'M6', name: 'Sincronización Firebase/SQL', status: diff > 15 ? 'critical' : 'warning', message: msg, detail: { firebaseCount, sqlCount, diff } });
        } else {
            checks.push({ id: 'M6', name: 'Sincronización Firebase/SQL', status: 'ok', message: `Firebase: ${firebaseCount} usuarios | SQL: ${sqlCount} usuarios (diferencia de ${diff}, dentro del rango normal).`, detail: { firebaseCount, sqlCount, diff } });
        }
    } catch (err: any) {
        checks.push({ id: 'M6', name: 'Sincronización Firebase/SQL', status: 'critical', message: `Error al conectar con Firebase Admin: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M7: Stripe Live activo y webhook configurado
    // ─────────────────────────────────────────────────────────────────
    try {
        const hasStripeKey = !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_live_');
        const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;

        if (!hasStripeKey || !hasWebhook) {
            const issues = [];
            if (!hasStripeKey) issues.push('STRIPE_SECRET_KEY no está en modo live');
            if (!hasWebhook) issues.push('STRIPE_WEBHOOK_SECRET no está configurado');
            const msg = `Configuración de pagos incompleta: ${issues.join('; ')}`;
            await createAlert('M7_STRIPE_CONFIG', msg, 'critical');
            alertsCreated++;
            checks.push({ id: 'M7', name: 'Stripe Live & Webhook', status: 'critical', message: msg });
        } else {
            checks.push({ id: 'M7', name: 'Stripe Live & Webhook', status: 'ok', message: 'Stripe en modo Live y webhook configurados correctamente.' });
        }
    } catch (err: any) {
        checks.push({ id: 'M7', name: 'Stripe Live & Webhook', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // M8: Casos en bolsa pública sin asignar > 48 horas
    // ─────────────────────────────────────────────────────────────────
    try {
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
        const staleCases = await prisma.contactRequest.count({
            where: {
                status: 'pending',
                lawyerProfileId: null,
                createdAt: { lt: fortyEightHoursAgo }
            }
        });

        if (staleCases > 0) {
            const msg = `${staleCases} caso(s) en la bolsa pública sin asignación de abogado desde hace más de 48 horas.`;
            await createAlert('M8_STALE_CASES', msg, staleCases > 5 ? 'high' : 'medium');
            alertsCreated++;
            checks.push({ id: 'M8', name: 'Casos Sin Asignar (+48h)', status: staleCases > 5 ? 'critical' : 'warning', message: msg, detail: { staleCases } });
        } else {
            checks.push({ id: 'M8', name: 'Casos Sin Asignar (+48h)', status: 'ok', message: 'No hay casos en bolsa pública sin abogado asignado por más de 48 horas.' });
        }
    } catch (err: any) {
        checks.push({ id: 'M8', name: 'Casos Sin Asignar (+48h)', status: 'critical', message: `Error ejecutando chequeo: ${err.message}` });
    }

    // ─────────────────────────────────────────────────────────────────
    // Calcular estado global y guardar timestamp en SystemConfig
    // ─────────────────────────────────────────────────────────────────
    const hasCritical = checks.some(c => c.status === 'critical');
    const hasWarning = checks.some(c => c.status === 'warning');
    const overallStatus: 'ok' | 'warning' | 'critical' = hasCritical ? 'critical' : hasWarning ? 'warning' : 'ok';

    // Persist last run info in SystemConfig
    await prisma.systemConfig.upsert({
        where: { key: 'LAST_MONITOR_RUN' },
        update: { value: now.toISOString() },
        create: { key: 'LAST_MONITOR_RUN', value: now.toISOString(), description: 'Timestamp del último monitoreo automático ejecutado' }
    }).catch(() => {});

    await prisma.systemConfig.upsert({
        where: { key: 'LAST_MONITOR_STATUS' },
        update: { value: overallStatus },
        create: { key: 'LAST_MONITOR_STATUS', value: overallStatus, description: 'Estado del último monitoreo automático' }
    }).catch(() => {});

    await prisma.systemConfig.upsert({
        where: { key: 'LAST_MONITOR_ALERTS' },
        update: { value: String(alertsCreated) },
        create: { key: 'LAST_MONITOR_ALERTS', value: String(alertsCreated), description: 'Alertas creadas en el último monitoreo' }
    }).catch(() => {});

    const report: MonitoringReport = {
        runAt: now.toISOString(),
        overallStatus,
        checks,
        alertsCreated
    };

    const statusIcon = overallStatus === 'ok' ? '✅' : overallStatus === 'warning' ? '⚠️' : '🚨';
    console.log(`${statusIcon} [Monitor] Health check completed. Status: ${overallStatus.toUpperCase()} | Alerts created: ${alertsCreated}`);

    return report;
};

// Helper: Create AdminAlert avoiding duplicates within 24h for same type
const createAlert = async (type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await prisma.adminAlert.findFirst({
        where: {
            type,
            isResolved: false,
            createdAt: { gte: yesterday }
        }
    });

    if (existing) {
        // Update message with latest info rather than duplicating
        await prisma.adminAlert.update({
            where: { id: existing.id },
            data: { message, severity }
        });
        return;
    }

    await prisma.adminAlert.create({
        data: { type, message, severity }
    });
};
