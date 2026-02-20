import { Router } from 'express';
import * as vaultController from '../controllers/vaultController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All vault routes require authentication
router.use(authMiddleware);

// Get upload URL
router.post('/upload-url', vaultController.getUploadUrl);

// Save file metadata
router.post('/metadata', vaultController.saveFileMetadata);

// Get all files
router.get('/files', vaultController.getVaultFiles);

// Get download URL for a specific file
router.get('/files/:fileId/download', vaultController.getDownloadUrl);

// Delete file
router.delete('/files/:fileId', vaultController.deleteVaultFile);

export default router;
