import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as chatController from '../controllers/chatController';
import multer from 'multer';

const router = Router();

// Multer: store file in memory for Firebase upload (max 20MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf',
                         'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Send a message (User or Lawyer)
router.post('/messages', authMiddleware, chatController.sendMessage);

// Get conversation with a specific contact request
router.get('/messages/:contactRequestId', authMiddleware, chatController.getMessages);

// Mark messages as read
router.put('/messages/:contactRequestId/read', authMiddleware, chatController.markMessagesAsRead);

// Upload file for chat (Lawyer uploads from device)
router.post('/upload', authMiddleware, upload.single('file'), chatController.uploadChatFile);

export default router;
