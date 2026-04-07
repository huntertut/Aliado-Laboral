import { Router } from 'express';
import { getPymeProfile, updatePymeProfile, getCompliance, calculateLiquidation, getEmployees, addEmployee, getPymeLiability, generateDocument } from '../controllers/pymeController';
import pymeDocumentController from '../controllers/pymeDocumentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getPymeProfile);
router.put('/', authMiddleware, updatePymeProfile);
router.get('/compliance', authMiddleware, getCompliance);
router.post('/calculate', authMiddleware, calculateLiquidation);
router.get('/employees', authMiddleware, getEmployees);
router.post('/employees', authMiddleware, addEmployee);

// Document Routes (Pyme Basic)
router.get('/documents', authMiddleware, pymeDocumentController.getDocuments);
router.post('/documents/upload', authMiddleware, pymeDocumentController.uploadDocument);
router.post('/documents/analyze-contract', authMiddleware, pymeDocumentController.analyzeContract);

// Value Added Services (Pro)
router.get('/liability', authMiddleware, getPymeLiability);
router.post('/generate-document', authMiddleware, generateDocument); // Backward compatible mapping logic handled inside controller

export default router;
