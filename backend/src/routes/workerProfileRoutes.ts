
import { Router } from 'express';
import * as workerProfileController from '../controllers/workerProfileController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get My Profile
router.get('/', authMiddleware, workerProfileController.getProfile);

// Update My Profile
router.put('/', authMiddleware, workerProfileController.updateProfile);

// Salary Thermometer Benchmark
router.get('/benchmark', authMiddleware, workerProfileController.getSalaryBenchmark);

export default router;
