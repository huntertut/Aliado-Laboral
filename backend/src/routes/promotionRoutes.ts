import express from 'express';
import { getActivePromotions } from '../controllers/promotionController';

const router = express.Router();

router.get('/active', getActivePromotions);

export default router;
