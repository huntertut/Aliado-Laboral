import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import lawyerRoutes from './routes/lawyerRoutes';
import caseRoutes from './routes/caseRoutes';
import aiRoutes from './routes/aiRoutes';
import contactRoutes from './routes/contactRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import lawyerProfileRoutes from './routes/lawyerProfileRoutes';
import workerSubscriptionRoutes from './routes/workerSubscriptionRoutes';
import workerProfileRoutes from './routes/workerProfileRoutes';
import adminRoutes from './routes/adminRoutes';
import supervisorRoutes from './routes/supervisorRoutes';
import accountantRoutes from './routes/accountantRoutes';
import chatRoutes from './routes/chatRoutes';
import vaultRoutes from './routes/vaultRoutes';
import newsRoutes from './routes/newsRoutes';
import pymeRoutes from './routes/pymeRoutes';
import systemRoutes from './routes/systemRoutes';
import forumRoutes from './routes/forumRoutes';
import devRoutes from './routes/devRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import documentRoutes from './routes/documentRoutes';
import jurisdictionRoutes from './routes/jurisdictionRoutes';
import promotionRoutes from './routes/promotionRoutes';
import webhookRoutes from './routes/webhookRoutes';

// ... (imports)

// Iniciar servicios en segundo plano (Cronjobs)
import './services/cronService';

// ... (middleware)



const app = express();
app.set('trust proxy', 1); // Necesario para express-rate-limit detrás de Apache/Nginx
const port = process.env.PORT || 3000;

// Force Redeploy: Triggering new build to load DATABASE_URL
console.log('Starting Derechos Laborales Backend...');

// DEBUG LOGGER (Moved to Top)
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

app.use(helmet());
app.use(cors());

// IMPORTANT: Webhooks must be BEFORE express.json() to maintain raw body for signature validation
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

app.use(express.json());

// --- SECURITY: Rate Limiting ---
import rateLimit from 'express-rate-limit';

// 1. Global Limiter (100 reqs / 15 min)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes, por favor intente más tarde.' }
});
app.use(globalLimiter);

// 2. Strict Auth Limiter (10 attempts / hour)
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15, // A bit of buffer for legitimate retries
    message: { error: 'Demasiados intentos de inicio de sesión. Bloqueado por 1 hora.' }
});
app.use('/auth/', authLimiter);
// -------------------------------
// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is reachable', ip: req.ip });
});

// ──────────────────────────────────────────────────────────────────────────────
// APP VERSION CONFIG — Force Update Endpoint
// Change MIN_VERSION_ANDROID / MIN_VERSION_IOS to force users to update.
// Uses 5-minute in-memory cache to avoid hitting the file on every request.
// ──────────────────────────────────────────────────────────────────────────────
const MIN_VERSION_ANDROID = '1.20.0';  // ← Change to force Android update (current: 1.20.0)
const MIN_VERSION_IOS = '1.20.0';  // ← Change to force iOS update    (current: 1.20.0)
let versionConfigCache: { data: any; expiry: number } | null = null;

app.get('/api/config/version', (req, res) => {
    const now = Date.now();
    if (versionConfigCache && versionConfigCache.expiry > now) {
        return res.json(versionConfigCache.data);
    }
    const data = {
        min_version_android: MIN_VERSION_ANDROID,
        min_version_ios: MIN_VERSION_IOS,
        update_url_android: 'market://details?id=com.aliadolaboral.app',
        update_url_ios: 'itms-apps://itunes.apple.com/app/id0000000000' // Update when iOS is published
    };
    versionConfigCache = { data, expiry: now + 5 * 60 * 1000 }; // 5 min cache
    res.json(data);
});
// ──────────────────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/lawyers', lawyerRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/ai', aiRoutes);
// NUEVAS RUTAS - Sistema de Contacto
app.use('/api/contact', contactRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/lawyer-profile', lawyerProfileRoutes);
app.use('/api/worker-subscription', workerSubscriptionRoutes);
app.use('/api/worker-profile', workerProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/supervisor', supervisorRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/pyme-profile', pymeRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forum', forumRoutes); // Forum Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/jurisdiction', jurisdictionRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/webhooks', webhookRoutes);

import reportRoutes from './routes/reportRoutes';
app.use('/api/reports', reportRoutes);

app.use('/api/dev', devRoutes);

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on port ${port} and listening on all interfaces (0.0.0.0)`);
});
