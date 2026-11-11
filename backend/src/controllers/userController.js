import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
  role: z.enum(['admin', 'staff_bapperida', 'opd', 'setwan']),
  opd_id: z.string().uuid('Format ID OPD tidak valid').nullable().optional(),
  is_active: z.boolean().optional()
});

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').optional(),
  role: z.enum(['admin', 'staff_bapperida', 'opd', 'setwan']).optional(),
  opd_id: z.string().uuid('Format ID OPD tidak valid').nullable().optional(),
  is_active: z.boolean().optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional()
});

/**
 * Mengambil daftar seluruh Pengguna Sistem (Khusus Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, opd_id, search, is_active } = req.query;

    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, opd_id, is_active, created_at, updated_at, master_opd:opd_id(id, kode_opd, nama_opd)')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }
    if (opd_id) {
      query = query.eq('opd_id', opd_id);
    }
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Gagal mengambil data pengguna', 500, error.message);
    }

    return successResponse(res, data, `Berhasil memuat ${data.length} pengguna`);
  } catch (error) {
    console.error('[Get Users Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat mengambil data pengguna', 500, error.message);
  }
};

/**
 * Mengambil detail 1 Pengguna berdasarkan ID (Khusus Admin)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, opd_id, is_active, created_at, updated_at, master_opd:opd_id(id, kode_opd, nama_opd)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(res, 'Pengguna tidak ditemukan', 404);
    }

    return successResponse(res, data, 'Detail pengguna berhasil dimuat');
  } catch (error) {
    return errorResponse(res, 'Gagal memuat detail pengguna', 500, error.message);
  }
};

/**
 * Menambah Pengguna Baru ke Supabase Auth & Profiles (Khusus Admin)
 */
export const createUser = async (req, res) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi data pengguna baru gagal', 422, parseResult.error.format());
    }

    const { email, password, full_name, role, opd_id, is_active = true } = parseResult.data;

    // Validasi bisnis: Jika role adalah OPD, opd_id sebaiknya diisi
    if (role === 'opd' && !opd_id) {
      return errorResponse(res, 'Pengguna dengan peran OPD wajib ditautkan dengan Master OPD', 422);
    }

    // 1. Buat user di Supabase Auth (auth.users)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        opd_id
      }
    });

    if (authError) {
      return errorResponse(res, 'Gagal membuat akun autentikasi', 400, authError.message);
    }

    const newUserId = authUser.user.id;

    // 2. Simpan profil ke public.profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUserId,
        email,
        full_name,
        role,
        opd_id: opd_id || null,
        is_active
      })
      .select('id, full_name, email, role, opd_id, is_active, created_at, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (profileError) {
      // Rollback auth user jika profil gagal dibuat
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return errorResponse(res, 'Gagal membuat profil pengguna', 500, profileError.message);
    }

    return successResponse(res, profile, 'Pengguna baru berhasil didaftarkan', 201);
  } catch (error) {
    console.error('[Create User Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat membuat pengguna', 500, error.message);
  }
};

/**
 * Memperbarui Data Pengguna (Khusus Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi update pengguna gagal', 422, parseResult.error.format());
    }

    const { full_name, role, opd_id, is_active, password } = parseResult.data;

    // 1. Update password jika ada permintaan reset kata sandi
    if (password) {
      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password
      });
      if (pwdError) {
        return errorResponse(res, 'Gagal mereset kata sandi pengguna', 500, pwdError.message);
      }
    }

    // 2. Update data tabel profiles
    const updatePayload = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (role !== undefined) updatePayload.role = role;
    if (opd_id !== undefined) updatePayload.opd_id = opd_id;
    if (is_active !== undefined) updatePayload.is_active = is_active;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', id)
      .select('id, full_name, email, role, opd_id, is_active, updated_at, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (profileError) {
      return errorResponse(res, 'Gagal memperbarui data pengguna', 500, profileError.message);
    }

    return successResponse(res, profile, 'Data pengguna berhasil diperbarui');
  } catch (error) {
    console.error('[Update User Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memperbarui pengguna', 500, error.message);
  }
};

/**
 * Menghapus Pengguna (Khusus Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    // Cegah admin menghapus dirinya sendiri
    if (req.user.id === id) {
      return errorResponse(res, 'Anda tidak dapat menghapus akun Anda sendiri', 400);
    }

    if (permanent === 'true') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        return errorResponse(res, 'Gagal menghapus pengguna secara permanen', 500, error.message);
      }
      return successResponse(res, null, 'Pengguna berhasil dihapus permanen dari sistem');
    }

    // Default: Soft delete (nonaktifkan akun)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, is_active')
      .single();

    if (error) {
      return errorResponse(res, 'Gagal menonaktifkan pengguna', 500, error.message);
    }

    return successResponse(res, data, 'Pengguna berhasil dinonaktifkan');
  } catch (error) {
    return errorResponse(res, 'Terjadi kesalahan sistem saat menonaktifkan pengguna', 500, error.message);
  }
};

