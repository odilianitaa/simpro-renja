import { Router } from 'express';
import authRoutes from './authRoutes.js';
import opdRoutes from './opdRoutes.js';
import userRoutes from './userRoutes.js';
import importRoutes from './importRoutes.js';
import proposalRoutes from './proposalRoutes.js';
import workflowRoutes from './workflowRoutes.js';
import reportRoutes from './reportRoutes.js';

const router = Router();

// Endpoint status kesehatan server
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'SIMPRO RENJA API Server',
    instansi: 'BAPPERIDA Kabupaten Banyumas',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Modul Rute Fase 1, 2, 3, & 5
router.use('/auth', authRoutes);
router.use('/opd', opdRoutes);
router.use('/users', userRoutes);
router.use('/import', importRoutes);
router.use('/proposals', proposalRoutes);
router.use('/workflow', workflowRoutes);
router.use('/reports', reportRoutes);

export default router;
