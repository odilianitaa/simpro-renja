import { supabaseAdmin } from '../config/supabaseClient.js';
import { parseSipdExcel } from '../utils/excelParser.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

/**
 * Helper mengambil seluruh Master OPD aktif untuk pemetaan otomatis
 */
const getActiveMasterOpd = async () => {
  const { data, error } = await supabaseAdmin
    .from('master_opd')
    .select('id, kode_opd, nama_opd')
    .eq('is_active', true);

  if (error) {
    console.error('[Import Controller] Gagal memuat Master OPD:', error);
    return [];
  }
  return data || [];
};

/**
 * 1. PREVIEW IMPORT EXCEL (Tanpa Menyimpan ke Database)
 * Digunakan oleh Admin untuk memverifikasi data sebelum commit
 */
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'File Excel SIPD (.xlsx / .xls) wajib diunggah', 400);
    }

    const masterOpdList = await getActiveMasterOpd();
    const parseResult = parseSipdExcel(req.file.buffer, masterOpdList);

    return successResponse(res, {
      filename: req.file.originalname,
      fileSize: req.file.size,
      summary: parseResult.summary,
      sampleDataDitolak: parseResult.proposalsToImport.slice(0, 10), // 10 sampel data usulan ditolak
      sampleDataIgnored: parseResult.ignoredRows.slice(0, 10)       // 10 sampel data yang diabaikan
    }, 'Preview import Excel SIPD berhasil diproses');
  } catch (error) {
    console.error('[Preview Import Error]:', error);
    return errorResponse(res, 'Gagal memproses file Excel SIPD', 500, error.message);
  }
};

/**
 * 2. EKSEKUSI IMPORT EXCEL SIPD (Commit ke Database via Upsert)
 * Hanya baris dengan STATUS == "Ditolak" yang dimasukkan ke SIMPRO RENJA
 */
export const executeImport = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'File Excel SIPD (.xlsx / .xls) wajib diunggah', 400);
    }

    const masterOpdList = await getActiveMasterOpd();
    const { summary, proposalsToImport } = parseSipdExcel(req.file.buffer, masterOpdList);

    if (proposalsToImport.length === 0) {
      return errorResponse(
        res,
        'Tidak ditemukan usulan berstatus "Ditolak" di dalam file Excel yang diunggah.',
        422,
        summary.statusDistribution
      );
    }

    // A. Buat Riwayat Batch Import
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('import_batches')
      .insert({
        filename: req.file.originalname,
        total_rows_excel: summary.totalRowsExcel,
        total_ditolak_imported: summary.totalDitolak,
        imported_by: req.user.id
      })
      .select()
      .single();

    if (batchError) {
      return errorResponse(res, 'Gagal membuat catatan batch import', 500, batchError.message);
    }

    const batchId = batch.id;

    // B. Siapkan Payload Bersih (Hapus helper _meta dan sematkan import_batch_id)
    const cleanedProposals = proposalsToImport.map(item => {
      const { _meta, ...cleanProposal } = item;
      return {
        ...cleanProposal,
        import_batch_id: batchId
      };
    });

    // C. Eksekusi Chunked Upsert (Batch per 200 baris untuk efisiensi & stabilitas)
    const CHUNK_SIZE = 200;
    let totalImportedOrUpdated = 0;
    const insertedProposalIds = [];

    for (let i = 0; i < cleanedProposals.length; i += CHUNK_SIZE) {
      const chunk = cleanedProposals.slice(i, i + CHUNK_SIZE);
      
      const { data: upsertData, error: upsertError } = await supabaseAdmin
        .from('proposals')
        .upsert(chunk, {
          onConflict: 'id_usulan_sipd'
        })
        .select('id, id_usulan_sipd');

      if (upsertError) {
        console.error(`[Import Controller] Error pada chunk ${i / CHUNK_SIZE}:`, upsertError);
        return errorResponse(
          res,
          `Terjadi kegagalan saat menyimpan data usulan ke database pada baris ${i + 1}`,
          500,
          upsertError.message
        );
      }

      if (upsertData) {
        totalImportedOrUpdated += upsertData.length;
        upsertData.forEach(p => insertedProposalIds.push(p.id));
      }
    }

    // D. Catat Audit Log Inisial untuk Proposal Baru
    if (insertedProposalIds.length > 0) {
      const logsToInsert = insertedProposalIds.map(pId => ({
        proposal_id: pId,
        from_stage: null,
        to_stage: 'MASUK_SISTEM',
        catatan: `Diimpor dari file SIPD: ${req.file.originalname} (Batch: ${batchId})`,
        actor_id: req.user.id
      }));

      // Masukkan log dalam potongan 500 record
      for (let i = 0; i < logsToInsert.length; i += 500) {
        const logChunk = logsToInsert.slice(i, i + 500);
        await supabaseAdmin.from('proposal_logs').insert(logChunk);
      }
    }

    return successResponse(res, {
      batchId,
      filename: req.file.originalname,
      totalRowsExcel: summary.totalRowsExcel,
      totalDitolakImported: totalImportedOrUpdated,
      statusDistribution: summary.statusDistribution,
      fallbackOpdApplied: summary.fallbackOpdCount,
      matchedOpdCount: summary.matchedOpdCount,
      emptyBudgetCount: summary.emptyBudgetCount
    }, `Berhasil mengimpor ${totalImportedOrUpdated} usulan berstatus "Ditolak" ke dalam SIMPRO RENJA.`, 201);
  } catch (error) {
    console.error('[Execute Import Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat mengeksekusi import SIPD', 500, error.message);
  }
};

/**
 * 3. RIWAYAT BATCH IMPORT EXCEL (Audit Log)
 */
export const getImportHistory = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('import_batches')
      .select('id, filename, total_rows_excel, total_ditolak_imported, created_at, profiles:imported_by(id, full_name, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(res, 'Gagal memuat riwayat import', 500, error.message);
    }

    return successResponse(res, data, `Berhasil memuat ${data.length} riwayat import`);
  } catch (error) {
    return errorResponse(res, 'Terjadi kesalahan sistem saat mengambil riwayat import', 500, error.message);
  }
};

