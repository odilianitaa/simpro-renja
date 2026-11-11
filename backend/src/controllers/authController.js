import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { z } from 'zod';

const updateProfileSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional()
});

/**
 * Mengambil profil pengguna yang sedang login beserta data OPD & wewenang
 */
export const getMyProfile = async (req, res) => {
  try {
    return successResponse(res, req.user, 'Profil pengguna berhasil dimuat');
  } catch (error) {
    return errorResponse(res, 'Gagal memuat profil pengguna', 500, error.message);
  }
};

/**
 * Memperbarui profil pengguna mandiri (Nama lengkap / Password)
 */
export const updateMyProfile = async (req, res) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi data profil gagal', 422, parseResult.error.format());
    }

    const { full_name, password } = parseResult.data;
    const userId = req.user.id;

    // 1. Update nama lengkap di tabel profiles jika ada
    if (full_name) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (profileError) {
        return errorResponse(res, 'Gagal memperbarui profil nama', 500, profileError.message);
      }
    }

    // 2. Update password akun jika disertakan
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password
      });

      if (authError) {
        return errorResponse(res, 'Gagal memperbarui kata sandi akun', 500, authError.message);
      }
    }

    // Ambil data profil terbaru
    const { data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, opd_id, is_active, master_opd:opd_id(id, kode_opd, nama_opd)')
      .eq('id', userId)
      .single();

    return successResponse(res, updatedProfile, 'Profil berhasil diperbarui');
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memperbarui profil', 500, error.message);
  }
};

