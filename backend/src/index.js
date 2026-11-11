import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import { errorResponse } from './utils/responseFormatter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Konfigurasi CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan permintaan tanpa origin (seperti Postman atau server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Logging Request sederhana
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount seluruh REST API routes di /api
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Selamat datang di API Server SIMPRO RENJA BAPPERIDA Banyumas',
    docs: '/api/health'
  });
});

// 404 Handler untuk rute yang tidak ditemukan
app.use((req, res) => {
  return errorResponse(res, `Rute ${req.method} ${req.originalUrl} tidak ditemukan`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  return errorResponse(
    res,
    err.message || 'Terjadi kesalahan internal pada server',
    err.status || 500,
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SIMPRO RENJA Backend Server Aktif di Port ${PORT}`);
  console.log(`🌐 Base API: http://localhost:${PORT}/api`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

export default app;
