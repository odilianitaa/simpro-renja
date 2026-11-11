import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse, paginationResponse } from '../utils/responseFormatter.js';

/**
 * Helper untuk menerapkan cakupan data (data scoping) sesuai wewenang peran pengguna
 * @param {object} req - Express request
 * @param {any} query - Supabase query builder
 * @returns {any} query
 */
const applyRoleScoping = (req, query) => {
  const role = req.user.role;
  const userOpdId = req.user.opd_id;

  // 1. Admin & Staff BAPPERIDA: Memiliki wewenang melihat seluruh data
  if (role === 'admin' || role === 'staff_bapperida') {
    return query;
  }

  // 2. Setwan: Hanya melihat proposal yang berkaitan dengan RDP hingga tahap akhir
  if (role === 'setwan') {
    return query.in('status_tahapan', [
      'PROSES_RDP',
      'DITERUSKAN_KE_OPD',
      'SELESAI_ANALISIS_OPD',
      'MASUK_RENJA',
      'TIDAK_MASUK_RENJA'
    ]);
  }

  // 3. OPD: Hanya melihat proposal yang ditujukan kepada OPD-nya dan telah diteruskan
  if (role === 'opd') {
    if (!userOpdId) {
      // Jika akun OPD belum ditautkan ke Master OPD, batasi agar tidak melihat data sembarangan
      return query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
    return query
      .eq('opd_id', userOpdId)
      .in('status_tahapan', [
        'DITERUSKAN_KE_OPD',
        'SELESAI_ANALISIS_OPD',
        'MASUK_RENJA',
        'TIDAK_MASUK_RENJA'
      ]);
  }

  return query;
};

/**
 * 1. MENGAMBIL DAFTAR PROPOSAL (FR-01, FR-08)
 * Mendukung pencarian kata kunci, multi-filter, pagination, dan batasan role
 */
export const getProposals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status_tahapan,
      opd_id,
      tahun,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('proposals')
      .select(`
        id,
        no_urut_excel,
        id_usulan_sipd,
        tanggal_usul,
        pengusul,
        usulan,
        masalah,
        alamat_lokasi,
        status_sipd,
        status_tahapan,
        volume,
        satuan,
        anggaran_awal_sipd,
        anggaran_proposal,
        anggaran_analisis_opd,
        anggaran_persetujuan,
        opd_id,
        created_at,
        updated_at,
        master_opd:opd_id (id, kode_opd, nama_opd)
      `, { count: 'exact' });

    // Terapkan pembatasan hak akses role
    query = applyRoleScoping(req, query);

    // Filter Status Tahapan
    if (status_tahapan) {
      query = query.eq('status_tahapan', status_tahapan);
    }

    // Filter OPD (Khusus Admin/BAPPERIDA/Setwan)
    if (opd_id && (req.user.role === 'admin' || req.user.role === 'staff_bapperida' || req.user.role === 'setwan')) {
      query = query.eq('opd_id', opd_id);
    }

    // Filter Tahun
    if (tahun) {
      query = query.gte('tanggal_usul', `${tahun}-01-01`).lte('tanggal_usul', `${tahun}-12-31`);
    }

    // Pencarian Kata Kunci (ID Usulan, Pengusul, Usulan, Alamat Lokasi)
    if (search.trim()) {
      const s = search.trim();
      const isNumeric = /^\d+$/.test(s);

      if (isNumeric) {
        query = query.or(`id_usulan_sipd.eq.${s},pengusul.ilike.%${s}%,usulan.ilike.%${s}%,alamat_lokasi.ilike.%${s}%`);
      } else {
        query = query.or(`pengusul.ilike.%${s}%,usulan.ilike.%${s}%,alamat_lokasi.ilike.%${s}%`);
      }
    }

    // Pengurutan (Sorting)
    const validSortColumns = ['created_at', 'tanggal_usul', 'id_usulan_sipd', 'anggaran_proposal', 'anggaran_persetujuan'];
    const sortField = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const isAscending = sort_order.toLowerCase() === 'asc';

    query = query
      .order(sortField, { ascending: isAscending })
      .range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('[Get Proposals Error]:', error);
      return errorResponse(res, 'Gagal mengambil data proposal', 500, error.message);
    }

    return paginationResponse(res, data, {
      page: pageNum,
      limit: limitNum,
      totalRows: count
    }, 'Daftar proposal berhasil dimuat');
  } catch (error) {
    console.error('[Get Proposals Server Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memuat proposal', 500, error.message);
  }
};

/**
 * 2. MENGAMBIL DETAIL LENGKAP PROPOSAL & AUDIT LOG (FR-02)
 * Menampilkan 21 atribut asli SIPD, 3 tahap anggaran, dan riwayat status
 */
export const getProposalById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = supabaseAdmin
      .from('proposals')
      .select(`
        *,
        master_opd:opd_id (id, kode_opd, nama_opd),
        verified_user:verified_by (id, full_name, email),
        rdp_user:rdp_processed_by (id, full_name, email),
        analyzed_user:analyzed_by (id, full_name, email),
        tpad_user:tpad_decided_by (id, full_name, email)
      `)
      .eq('id', id);

    query = applyRoleScoping(req, query);

    const { data: proposal, error } = await query.single();

    if (error || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan atau Anda tidak memiliki akses ke proposal ini', 404);
    }

    // Ambil riwayat audit log transisi tahapan proposal
    const { data: logs, error: logsError } = await supabaseAdmin
      .from('proposal_logs')
      .select(`
        id,
        from_stage,
        to_stage,
        anggaran_recorded,
        catatan,
        created_at,
        actor:actor_id (id, full_name, email, role)
      `)
      .eq('proposal_id', id)
      .order('created_at', { ascending: true });

    const responseData = {
      ...proposal,
      logs: logs || []
    };

    return successResponse(res, responseData, 'Detail proposal berhasil dimuat');
  } catch (error) {
    console.error('[Get Proposal Detail Error]:', error);
    return errorResponse(res, 'Gagal memuat detail proposal', 500, error.message);
  }
};

/**
 * 3. STATISTIK DASHBOARD & RINGKASAN TAHAPAN (FR-09)
 */
export const getProposalStats = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('proposals')
      .select('status_tahapan, anggaran_proposal, anggaran_analisis_opd, anggaran_persetujuan, opd_id');

    query = applyRoleScoping(req, query);

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Gagal menghitung statistik proposal', 500, error.message);
    }

    const stagesCount = {
      MASUK_SISTEM: 0,
      TERVERIFIKASI_BAPPERIDA: 0,
      PROSES_RDP: 0,
      DITERUSKAN_KE_OPD: 0,
      SELESAI_ANALISIS_OPD: 0,
      MASUK_RENJA: 0,
      TIDAK_MASUK_RENJA: 0
    };

    let totalAnggaranProposal = 0;
    let totalAnggaranAnalisisOpd = 0;
    let totalAnggaranPersetujuan = 0;

    data.forEach(p => {
      if (stagesCount[p.status_tahapan] !== undefined) {
        stagesCount[p.status_tahapan]++;
      }
      if (p.anggaran_proposal) totalAnggaranProposal += Number(p.anggaran_proposal);
      if (p.anggaran_analisis_opd) totalAnggaranAnalisisOpd += Number(p.anggaran_analisis_opd);
      if (p.anggaran_persetujuan) totalAnggaranPersetujuan += Number(p.anggaran_persetujuan);
    });

    return successResponse(res, {
      totalProposals: data.length,
      stages: stagesCount,
      budgets: {
        totalAnggaranProposal,
        totalAnggaranAnalisisOpd,
        totalAnggaranPersetujuan
      }
    }, 'Statistik proposal berhasil dimuat');
  } catch (error) {
    console.error('[Get Stats Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memuat statistik', 500, error.message);
  }
};

