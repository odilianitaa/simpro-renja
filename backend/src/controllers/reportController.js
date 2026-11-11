import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

/**
 * Helper pembatas wewenang akses data laporan sesuai Peran (Role Scoping)
 */
const applyRoleScoping = (req, query) => {
  const role = req.user.role;
  const userOpdId = req.user.opd_id;

  if (role === 'admin' || role === 'staff_bapperida') {
    return query;
  }

  if (role === 'setwan') {
    return query.in('status_tahapan', [
      'PROSES_RDP',
      'DITERUSKAN_KE_OPD',
      'SELESAI_ANALISIS_OPD',
      'MASUK_RENJA',
      'TIDAK_MASUK_RENJA'
    ]);
  }

  if (role === 'opd') {
    if (!userOpdId) {
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
 * 1. REKAPITULASI AGREGAT LAPORAN (Per OPD & Per Tahapan)
 */
export const getReportSummary = async (req, res) => {
  try {
    const { tahun, opd_id } = req.query;

    let query = supabaseAdmin
      .from('proposals')
      .select(`
        id,
        status_tahapan,
        anggaran_awal_sipd,
        anggaran_proposal,
        anggaran_analisis_opd,
        anggaran_persetujuan,
        opd_id,
        tanggal_usul,
        master_opd:opd_id (id, kode_opd, nama_opd)
      `);

    query = applyRoleScoping(req, query);

    if (tahun) {
      query = query.gte('tanggal_usul', `${tahun}-01-01`).lte('tanggal_usul', `${tahun}-12-31`);
    }

    if (opd_id) {
      query = query.eq('opd_id', opd_id);
    }

    const { data: proposals, error } = await query;

    if (error) {
      return errorResponse(res, 'Gagal mengambil data rekapitulasi', 500, error.message);
    }

    // Hitung agregasi global
    let totalProposals = proposals.length;
    let totalAnggaranProposal = 0;
    let totalAnggaranAnalisisOpd = 0;
    let totalAnggaranPersetujuan = 0;

    const opdSummaryMap = {};

    proposals.forEach((p) => {
      const opdName = p.master_opd?.nama_opd || 'Belum Ditetapkan';
      const opdCode = p.master_opd?.kode_opd || '-';
      const opdKey = p.opd_id || 'unassigned';

      if (!opdSummaryMap[opdKey]) {
        opdSummaryMap[opdKey] = {
          opd_id: p.opd_id,
          nama_opd: opdName,
          kode_opd: opdCode,
          total_usulan: 0,
          masuk_sistem: 0,
          terverifikasi: 0,
          proses_rdp: 0,
          kajian_opd: 0,
          masuk_renja: 0,
          tidak_masuk_renja: 0,
          total_anggaran_proposal: 0,
          total_anggaran_analisis: 0,
          total_anggaran_persetujuan: 0
        };
      }

      const item = opdSummaryMap[opdKey];
      item.total_usulan++;

      if (p.status_tahapan === 'MASUK_SISTEM') item.masuk_sistem++;
      else if (p.status_tahapan === 'TERVERIFIKASI_BAPPERIDA') item.terverifikasi++;
      else if (p.status_tahapan === 'PROSES_RDP') item.proses_rdp++;
      else if (['DITERUSKAN_KE_OPD', 'SELESAI_ANALISIS_OPD'].includes(p.status_tahapan)) item.kajian_opd++;
      else if (p.status_tahapan === 'MASUK_RENJA') item.masuk_renja++;
      else if (p.status_tahapan === 'TIDAK_MASUK_RENJA') item.tidak_masuk_renja++;

      if (p.anggaran_proposal) {
        item.total_anggaran_proposal += Number(p.anggaran_proposal);
        totalAnggaranProposal += Number(p.anggaran_proposal);
      }
      if (p.anggaran_analisis_opd) {
        item.total_anggaran_analisis += Number(p.anggaran_analisis_opd);
        totalAnggaranAnalisisOpd += Number(p.anggaran_analisis_opd);
      }
      if (p.anggaran_persetujuan) {
        item.total_anggaran_persetujuan += Number(p.anggaran_persetujuan);
        totalAnggaranPersetujuan += Number(p.anggaran_persetujuan);
      }
    });

    const opdSummaryList = Object.values(opdSummaryMap).sort((a, b) => b.total_usulan - a.total_usulan);

    return successResponse(res, {
      totals: {
        totalProposals,
        totalAnggaranProposal,
        totalAnggaranAnalisisOpd,
        totalAnggaranPersetujuan
      },
      byOpd: opdSummaryList
    }, 'Rekapitulasi laporan berhasil dihitung');
  } catch (error) {
    console.error('[Get Report Summary Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memproses rekapitulasi', 500, error.message);
  }
};

/**
 * 2. DATASET LENGKAP UNTUK EKSPOR (Excel & PDF)
 */
export const getExportData = async (req, res) => {
  try {
    const { status_tahapan, opd_id, tahun, search } = req.query;

    let query = supabaseAdmin
      .from('proposals')
      .select(`
        id_usulan_sipd,
        tanggal_usul,
        pengusul,
        usulan,
        masalah,
        alamat_lokasi,
        volume,
        satuan,
        anggaran_awal_sipd,
        anggaran_proposal,
        anggaran_analisis_opd,
        anggaran_persetujuan,
        status_tahapan,
        jenis_belanja,
        sub_kegiatan,
        catatan_verifikasi_bapperida,
        catatan_proses_rdp,
        catatan_analisis_opd,
        catatan_tpad_renja,
        created_at,
        master_opd:opd_id (id, kode_opd, nama_opd)
      `)
      .order('id_usulan_sipd', { ascending: true });

    query = applyRoleScoping(req, query);

    if (status_tahapan) {
      query = query.eq('status_tahapan', status_tahapan);
    }
    if (opd_id) {
      query = query.eq('opd_id', opd_id);
    }
    if (tahun) {
      query = query.gte('tanggal_usul', `${tahun}-01-01`).lte('tanggal_usul', `${tahun}-12-31`);
    }
    if (search && search.trim()) {
      const s = search.trim();
      query = query.or(`pengusul.ilike.%${s}%,usulan.ilike.%${s}%,alamat_lokasi.ilike.%${s}%`);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(res, 'Gagal mengambil data ekspor', 500, error.message);
    }

    // Format representasi data siap ekspor
    const exportDataset = data.map((item, idx) => ({
      no: idx + 1,
      id_usulan_sipd: item.id_usulan_sipd,
      tanggal_usul: item.tanggal_usul || '-',
      pengusul: item.pengusul,
      usulan: item.usulan,
      masalah: item.masalah || '-',
      alamat_lokasi: item.alamat_lokasi || '-',
      volume_satuan: item.volume ? `${item.volume} ${item.satuan || ''}` : '-',
      nama_opd: item.master_opd?.nama_opd || 'Belum Ditetapkan',
      sub_kegiatan: item.sub_kegiatan || '-',
      jenis_belanja: item.jenis_belanja || '-',
      anggaran_awal_sipd: item.anggaran_awal_sipd || 0,
      anggaran_proposal: item.anggaran_proposal || 0,
      anggaran_analisis_opd: item.anggaran_analisis_opd || 0,
      anggaran_persetujuan: item.anggaran_persetujuan || 0,
      status_tahapan: item.status_tahapan,
      catatan_terakhir: item.catatan_tpad_renja || item.catatan_analisis_opd || item.catatan_verifikasi_bapperida || '-'
    }));

    return successResponse(res, exportDataset, `Berhasil memuat ${exportDataset.length} data usulan untuk diekspor`);
  } catch (error) {
    console.error('[Get Export Data Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat menyiapkan data ekspor', 500, error.message);
  }
};

