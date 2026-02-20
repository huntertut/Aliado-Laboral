import { Router } from 'express';
import * as lawyerProfileController from '../controllers/lawyerProfileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Middleware para verificar que el usuario es abogado
const lawyerOnly = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'lawyer') {
        return res.status(403).json({ error: 'Acceso solo para abogados' });
    }
    next();
};

// PÚBLICO - Listar abogados (sin datos sensibles)
router.get('/public', lawyerProfileController.getPublicLawyers);

// PÚBLICO - Ver perfil público de abogado
router.get('/public/:id', lawyerProfileController.getPublicProfile);

// ABOGADO - Editar mi perfil
router.put('/my-profile', authMiddleware, lawyerOnly, lawyerProfileController.updateMyProfile);

// ABOGADO - Ver métricas (vistas, solicitudes, etc.)
router.get('/my-metrics', authMiddleware, lawyerOnly, lawyerProfileController.getMyMetrics);

// ABOGADO - Obtener mi perfil completo
router.get('/my-profile', authMiddleware, lawyerOnly, lawyerProfileController.getMyProfile);

export default router;
