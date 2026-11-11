import { Router } from 'express';
import {
  getAllOpd,
  getOpdById,
  createOpd,
  updateOpd,
  deleteOpd
} from '../controllers/opdController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

// Seluruh rute OPD membutuhkan autentikasi
router.use(requireAuth);

// Baca daftar & detail Master OPD (dapat diakses semua pengguna terautentikasi)
router.get('/', getAllOpd);
router.get('/:id', getOpdById);

// Operasi perubahan Master OPD (Khusus Admin)
router.post('/', requireRole('admin'), createOpd);
router.put('/:id', requireRole('admin'), updateOpd);
router.delete('/:id', requireRole('admin'), deleteOpd);

export default router;

