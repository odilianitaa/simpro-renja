import { Router } from 'express';
import {
  previewImport,
  executeImport,
  getImportHistory
} from '../controllers/importController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { uploadExcel } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Seluruh rute import membutuhkan autentikasi
router.use(requireAuth);

// 1. Preview data Excel SIPD (Admin & Staff BAPPERIDA)
router.post('/preview', requireRole('admin', 'staff_bapperida'), uploadExcel.single('file'), previewImport);

// 2. Eksekusi commit import ke tabel proposals (Khusus Admin)
router.post('/execute', requireRole('admin'), uploadExcel.single('file'), executeImport);

// 3. Riwayat batch import SIPD
router.get('/history', requireRole('admin', 'staff_bapperida'), getImportHistory);

export default router;

