import { Router } from 'express';
import {
    getCourses,
    getCourseDetails,
    createCoursePaymentIntent,
    toggleLessonCompletion,
    adminCreateCourse,
    adminUpdateCourse,
    adminDeleteCourse,
    adminAddModule,
    adminAddLesson,
} from '../controllers/courseController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Worker/User endpoints
router.get('/', authMiddleware, getCourses);
router.get('/:id', authMiddleware, getCourseDetails);
router.post('/purchase', authMiddleware, requireRole(['worker']), createCoursePaymentIntent);
router.post('/lesson/:lessonId/complete', authMiddleware, requireRole(['worker']), toggleLessonCompletion);

// Admin-only endpoints for content creation
router.post('/admin/create', authMiddleware, requireRole(['admin']), adminCreateCourse);
router.put('/admin/update/:id', authMiddleware, requireRole(['admin']), adminUpdateCourse);
router.delete('/admin/delete/:id', authMiddleware, requireRole(['admin']), adminDeleteCourse);
router.post('/admin/module', authMiddleware, requireRole(['admin']), adminAddModule);
router.post('/admin/lesson', authMiddleware, requireRole(['admin']), adminAddLesson);

export default router;
