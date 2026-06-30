import { Router } from 'express';
import {
    getDocumentCatalog,
    getMyDocuments,
    createDocumentPaymentIntent,
    generateLegalDocument,
} from '../controllers/legalDocumentController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Public: Get available document types and prices
router.get('/catalog', getDocumentCatalog);

// Worker: Get their purchased documents
router.get('/my-documents', authMiddleware, requireRole(['worker']), getMyDocuments);

// Worker: Initiate purchase of a legal document
router.post('/purchase', authMiddleware, requireRole(['worker']), createDocumentPaymentIntent);

// Worker: Download/generate PDF after payment
router.get('/generate/:documentId', authMiddleware, requireRole(['worker']), generateLegalDocument);

export default router;
