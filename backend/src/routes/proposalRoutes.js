import { Router } from 'express';
import {
  getProposals,
  getProposalById,
  getProposalStats
} from '../controllers/proposalController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Seluruh akses proposal memerlukan autentikasi
router.use(requireAuth);

// 1. Ringkasan statistik & metrik tahapan dashboard
router.get('/stats', getProposalStats);

// 2. Daftar proposal dengan pencarian, multi-filter & pagination
router.get('/', getProposals);

// 3. Detail lengkap 1 proposal beserta riwayat audit log & 3 tahap anggaran
router.get('/:id', getProposalById);

export default router;

