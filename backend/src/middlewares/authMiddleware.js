import { supabaseAdmin } from '../config/supabaseClient.js';
import { errorResponse } from '../utils/responseFormatter.js';

/**
 * Middleware untuk memvalidasi JWT Token Supabase Auth
 * dan mengambil data profil pengguna beserta relasi Master OPD.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Akses tidak diizinkan. Token autentikasi tidak ditemukan.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Format token tidak valid.', 401);
    }

    // 1. Validasi Token ke Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return errorResponse(res, 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401, authError?.message);
    }

    const authUser = authData.user;

    // 2. Ambil Profil Pengguna dari tabel public.profiles
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, opd_id, is_active, created_at, master_opd:opd_id(id, kode_opd, nama_opd)')
      .eq('id', authUser.id)
      .single();

    // Fallback: Jika profil belum tercatat di public.profiles tapi akun ada di auth.users
    if (!profile) {
      const defaultRole = authUser.user_metadata?.role || 'opd';
      const defaultFullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
      const defaultOpdId = authUser.user_metadata?.opd_id || null;

      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          full_name: defaultFullName,
          role: defaultRole,
          opd_id: defaultOpdId,
          is_active: true
        })
        .select('id, full_name, email, role, opd_id, is_active, created_at, master_opd:opd_id(id, kode_opd, nama_opd)')
        .single();

      if (insertError) {
        return errorResponse(res, 'Gagal menginisialisasi profil pengguna.', 500, insertError.message);
      }
      profile = newProfile;
    }

    // 3. Pastikan Akun dalam Status Aktif
    if (profile.is_active === false) {
      return errorResponse(res, 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.', 403);
    }

    // 4. Lampirkan informasi pengguna ke request
    req.user = {
      id: authUser.id,
      email: authUser.email,
      full_name: profile.full_name,
      role: profile.role,
      opd_id: profile.opd_id,
      opd: profile.master_opd || null,
      token
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memverifikasi autentikasi.', 500, error.message);
  }
};

