import { Router } from 'express';
import { getLawyers, getLawyerById, contactLawyer } from '../controllers/lawyerController';

const router = Router();

router.get('/', getLawyers);
router.get('/:id', getLawyerById);
router.post('/contact', contactLawyer);

export default router;
