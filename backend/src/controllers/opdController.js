import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { z } from 'zod';

const opdSchema = z.object({
  kode_opd: z.string().min(2, 'Kode OPD minimal 2 karakter').max(50),
  nama_opd: z.string().min(3, 'Nama OPD minimal 3 karakter'),
  is_active: z.boolean().optional()
});

/**
 * Mengambil daftar seluruh Master OPD
 */
export const getAllOpd = async (req, res) => {
  try {
    const { include_inactive, search } = req.query;

    let query = supabaseAdmin
      .from('master_opd')
      .select('id, kode_opd, nama_opd, is_active, created_at, updated_at')
      .order('nama_opd', { ascending: true });

    if (include_inactive !== 'true') {
      query = query.eq('is_active', true);
    }

    if (search) {
      query = query.or(`nama_opd.ilike.%${search}%,kode_opd.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Gagal mengambil data Master OPD', 500, error.message);
    }

    return successResponse(res, data, `Berhasil memuat ${data.length} Master OPD`);
  } catch (error) {
    console.error('[Get OPD Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat mengambil data OPD', 500, error.message);
  }
};

/**
 * Mengambil detail 1 OPD berdasarkan ID
 */
export const getOpdById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('master_opd')
      .select('id, kode_opd, nama_opd, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(res, 'Master OPD tidak ditemukan', 404);
    }

    return successResponse(res, data, 'Detail Master OPD berhasil dimuat');
  } catch (error) {
    return errorResponse(res, 'Gagal memuat detail OPD', 500, error.message);
  }
};

/**
 * Menambah Master OPD Baru (Khusus Admin)
 */
export const createOpd = async (req, res) => {
  try {
    const parseResult = opdSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi data OPD gagal', 422, parseResult.error.format());
    }

    const { kode_opd, nama_opd, is_active = true } = parseResult.data;

    const { data, error } = await supabaseAdmin
      .from('master_opd')
      .insert({
        kode_opd: kode_opd.toUpperCase().trim(),
        nama_opd: nama_opd.trim(),
        is_active
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return errorResponse(res, 'Kode OPD atau Nama OPD sudah terdaftar', 409, error.message);
      }
      return errorResponse(res, 'Gagal menyimpan Master OPD', 500, error.message);
    }

    return successResponse(res, data, 'Master OPD baru berhasil ditambahkan', 201);
  } catch (error) {
    console.error('[Create OPD Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat menambah OPD', 500, error.message);
  }
};

/**
 * Memperbarui Master OPD (Khusus Admin)
 */
export const updateOpd = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = opdSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi data OPD gagal', 422, parseResult.error.format());
    }

    const updatePayload = { ...parseResult.data };
    if (updatePayload.kode_opd) {
      updatePayload.kode_opd = updatePayload.kode_opd.toUpperCase().trim();
    }
    if (updatePayload.nama_opd) {
      updatePayload.nama_opd = updatePayload.nama_opd.trim();
    }

    const { data, error } = await supabaseAdmin
      .from('master_opd')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse(res, 'Gagal memperbarui Master OPD', 500, error.message);
    }

    return successResponse(res, data, 'Master OPD berhasil diperbarui');
  } catch (error) {
    return errorResponse(res, 'Terjadi kesalahan sistem saat memperbarui OPD', 500, error.message);
  }
};

/**
 * Menghapus atau Menonaktifkan Master OPD (Khusus Admin)
 */
export const deleteOpd = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === 'true') {
      const { error } = await supabaseAdmin.from('master_opd').delete().eq('id', id);
      if (error) {
        return errorResponse(res, 'Gagal menghapus OPD permanen (mungkin sedang berelasi dengan proposal)', 400, error.message);
      }
      return successResponse(res, null, 'Master OPD berhasil dihapus permanen');
    }

    // Default: Soft delete (nonaktifkan)
    const { data, error } = await supabaseAdmin
      .from('master_opd')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse(res, 'Gagal menonaktifkan Master OPD', 500, error.message);
    }

    return successResponse(res, data, 'Master OPD berhasil dinonaktifkan');
  } catch (error) {
    return errorResponse(res, 'Terjadi kesalahan sistem saat menghapus OPD', 500, error.message);
  }
};

