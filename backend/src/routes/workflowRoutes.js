import { Router } from 'express';
import {
  verifyProposal,
  processRdp,
  forwardToOpd,
  submitOpdAnalysis,
  decideTpadRenja,
  uploadProposalAttachment
} from '../controllers/workflowController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import { uploadAttachment } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.use(requireAuth);

// 1. Verifikasi Proposal oleh Staff BAPPERIDA (FR-03 & Input Anggaran Proposal)
router.post('/:id/verify', requireRole('admin', 'staff_bapperida'), verifyProposal);

// 2. Pencatatan Pembahasan RDP (FR-04)
router.post('/:id/rdp-process', requireRole('admin', 'staff_bapperida', 'setwan'), processRdp);

// 3. Disposisi Penerusan ke OPD Tujuan (FR-04)
router.post('/:id/forward-opd', requireRole('admin', 'staff_bapperida'), forwardToOpd);

// 4. Input Kajian Teknis Analisis oleh OPD (FR-05 & Input Anggaran Analisis OPD)
router.post('/:id/opd-analysis', requireRole('admin', 'staff_bapperida', 'opd'), submitOpdAnalysis);

// 5. Penetapan Keputusan Akhir TPAD / RENJA (FR-06 & Input Anggaran Persetujuan)
router.post('/:id/tpad-decision', requireRole('admin', 'staff_bapperida'), decideTpadRenja);

// 6. Unggah Dokumen Lampiran Pendukung (PDF)
router.post('/:id/attachment', requireRole('admin', 'staff_bapperida', 'opd'), uploadAttachment.single('file'), uploadProposalAttachment);

export default router;

