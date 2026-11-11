import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Seluruh rute auth memerlukan token aktif
router.use(requireAuth);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);

export default router;

