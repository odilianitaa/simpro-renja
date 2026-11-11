import { Router } from 'express';
import { getReportSummary, getExportData } from '../controllers/reportController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Seluruh rute laporan memerlukan autentikasi
router.use(requireAuth);

// 1. Rekapitulasi agregasi laporan per OPD & tahapan
router.get('/summary', getReportSummary);

// 2. Dataset lengkap terformat untuk ekspor Excel & PDF
router.get('/export-data', getExportData);

export default router;

