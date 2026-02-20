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

// ... (imports)

// ... (middleware)



const app = express();
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

app.use('/auth', authRoutes);
app.use('/lawyers', lawyerRoutes);
app.use('/cases', caseRoutes);
app.use('/ai', aiRoutes);
// NUEVAS RUTAS - Sistema de Contacto
app.use('/contact', contactRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/lawyer-profile', lawyerProfileRoutes);
app.use('/worker-subscription', workerSubscriptionRoutes);
app.use('/worker-profile', workerProfileRoutes);
app.use('/admin', adminRoutes);
app.use('/supervisor', supervisorRoutes);
app.use('/accountant', accountantRoutes);
app.use('/chat', chatRoutes);
app.use('/vault', vaultRoutes);
app.use('/news', newsRoutes);
app.use('/pyme-profile', pymeRoutes);
app.use('/pyme-profile', pymeRoutes);
app.use('/system', systemRoutes);
app.use('/forum', forumRoutes); // Forum Routes
app.use('/analytics', analyticsRoutes);
app.use('/documents', documentRoutes);

import reportRoutes from './routes/reportRoutes';
app.use('/reports', reportRoutes);

app.use('/api/dev', devRoutes);

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on port ${port} and listening on all interfaces (0.0.0.0)`);
});
