import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Middleware untuk membatasi akses endpoint berdasarkan Peran Pengguna (RBAC).
 * Role yang didukung: 'admin', 'staff_bapperida', 'opd', 'setwan'
 * 
 * @param  {...string} allowedRoles - Daftar role yang diizinkan mengakses endpoint
 * @example requireRole('admin', 'staff_bapperida')
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Autentikasi diperlukan sebelum memeriksa otorisasi.', 401);
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(
        res,
        `Akses ditolak. Peran '${userRole}' tidak memiliki wewenang untuk mengakses sumber daya ini. Wewenang yang dibutuhkan: [${allowedRoles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

