import { supabaseAdmin } from '../config/supabaseClient.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';
import { z } from 'zod';

// Helper membuat catatan audit log di tabel proposal_logs
const createAuditLog = async ({ proposal_id, from_stage, to_stage, anggaran_recorded = null, catatan = null, actor_id }) => {
  return await supabaseAdmin.from('proposal_logs').insert({
    proposal_id,
    from_stage,
    to_stage,
    anggaran_recorded,
    catatan,
    actor_id
  });
};

// ============================================================================
// 1. TAHAP VERIFIKASI BAPPERIDA (FR-03 & Anggaran Tier 1)
// ============================================================================
const verifySchema = z.object({
  anggaran_proposal: z.number().positive('Anggaran Proposal wajib lebih besar dari 0'),
  opd_id: z.string().uuid('Master OPD wajib dipilih'),
  catatan_verifikasi_bapperida: z.string().optional()
});

export const verifyProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = verifySchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi verifikasi BAPPERIDA gagal', 422, parseResult.error.format());
    }

    const { anggaran_proposal, opd_id, catatan_verifikasi_bapperida } = parseResult.data;

    // Ambil status proposal saat ini
    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, status_tahapan, opd_id')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan', 404);
    }

    // Validasi alur: Proposal harus berada pada tahapan awal MASUK_SISTEM atau TERVERIFIKASI_BAPPERIDA
    if (!['MASUK_SISTEM', 'TERVERIFIKASI_BAPPERIDA'].includes(proposal.status_tahapan)) {
      return errorResponse(
        res,
        `Proposal tidak dapat diverifikasi karena sedang berada pada tahapan '${proposal.status_tahapan}'`,
        400
      );
    }

    const fromStage = proposal.status_tahapan;
    const toStage = 'TERVERIFIKASI_BAPPERIDA';

    // Update proposal
    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update({
        anggaran_proposal,
        opd_id,
        catatan_verifikasi_bapperida: catatan_verifikasi_bapperida || null,
        verified_by: req.user.id,
        verified_at: new Date().toISOString(),
        status_tahapan: toStage
      })
      .eq('id', id)
      .select('*, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal menyimpan hasil verifikasi', 500, updateErr.message);
    }

    // Catat log transisi
    await createAuditLog({
      proposal_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      anggaran_recorded: anggaran_proposal,
      catatan: catatan_verifikasi_bapperida || 'Proposal diverifikasi oleh Staff BAPPERIDA',
      actor_id: req.user.id
    });

    return successResponse(res, updatedProposal, 'Proposal berhasil diverifikasi oleh BAPPERIDA');
  } catch (error) {
    console.error('[Verify Proposal Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memverifikasi proposal', 500, error.message);
  }
};

// ============================================================================
// 2. TAHAP PROSES RDP (FR-04)
// ============================================================================
const rdpSchema = z.object({
  catatan_proses_rdp: z.string().min(3, 'Catatan pembahasan RDP minimal 3 karakter'),
  catatan_setwan_rdp: z.string().optional()
});

export const processRdp = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = rdpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi data RDP gagal', 422, parseResult.error.format());
    }

    const { catatan_proses_rdp, catatan_setwan_rdp } = parseResult.data;

    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, status_tahapan, anggaran_proposal')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan', 404);
    }

    if (!['TERVERIFIKASI_BAPPERIDA', 'PROSES_RDP'].includes(proposal.status_tahapan)) {
      return errorResponse(
        res,
        `Proposal belum dapat diproses RDP karena belum diverifikasi atau sudah melewati tahapan ini (Status saat ini: ${proposal.status_tahapan})`,
        400
      );
    }

    const fromStage = proposal.status_tahapan;
    const toStage = 'PROSES_RDP';

    const updatePayload = {
      catatan_proses_rdp,
      rdp_processed_by: req.user.id,
      rdp_processed_at: new Date().toISOString(),
      status_tahapan: toStage
    };

    if (catatan_setwan_rdp) {
      updatePayload.catatan_setwan_rdp = catatan_setwan_rdp;
    }

    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update(updatePayload)
      .eq('id', id)
      .select('*, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal mencatat proses RDP', 500, updateErr.message);
    }

    await createAuditLog({
      proposal_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      anggaran_recorded: proposal.anggaran_proposal,
      catatan: catatan_proses_rdp,
      actor_id: req.user.id
    });

    return successResponse(res, updatedProposal, 'Proses RDP berhasil dicatat');
  } catch (error) {
    console.error('[Process RDP Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat memproses RDP', 500, error.message);
  }
};

// ============================================================================
// 3. TAHAP DISPOSISI / PENERUSAN KE OPD (FR-04)
// ============================================================================
export const forwardToOpd = async (req, res) => {
  try {
    const { id } = req.params;
    const { catatan_disposisi } = req.body;

    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, status_tahapan, opd_id, anggaran_proposal, master_opd:opd_id(nama_opd)')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan', 404);
    }

    if (!proposal.opd_id) {
      return errorResponse(res, 'Proposal belum memiliki OPD tujuan. Silakan tetapkan OPD pada tahap verifikasi.', 400);
    }

    if (!['PROSES_RDP', 'TERVERIFIKASI_BAPPERIDA'].includes(proposal.status_tahapan)) {
      return errorResponse(
        res,
        `Proposal tidak dapat diteruskan ke OPD pada tahapan '${proposal.status_tahapan}'`,
        400
      );
    }

    const fromStage = proposal.status_tahapan;
    const toStage = 'DITERUSKAN_KE_OPD';

    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update({
        status_tahapan: toStage
      })
      .eq('id', id)
      .select('*, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal meneruskan proposal ke OPD', 500, updateErr.message);
    }

    await createAuditLog({
      proposal_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      anggaran_recorded: proposal.anggaran_proposal,
      catatan: catatan_disposisi || `Diteruskan ke ${proposal.master_opd?.nama_opd || 'OPD Terkait'} untuk analisis teknis`,
      actor_id: req.user.id
    });

    return successResponse(res, updatedProposal, 'Proposal berhasil diteruskan ke OPD tujuan');
  } catch (error) {
    console.error('[Forward to OPD Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat mendisposisikan proposal', 500, error.message);
  }
};

// ============================================================================
// 4. TAHAP ANALISIS TEKNIS OLEH OPD (FR-05 & Anggaran Tier 2)
// ============================================================================
const opdAnalysisSchema = z.object({
  anggaran_analisis_opd: z.number().min(0, 'Anggaran Analisis OPD minimal 0'),
  sub_kegiatan: z.string().min(3, 'Sub Kegiatan hasil kajian teknis wajib diisi'),
  jenis_belanja: z.string().min(3, 'Jenis Belanja hasil kajian teknis wajib diisi'),
  volume_analisis_opd: z.number().optional().nullable(),
  satuan_analisis_opd: z.string().optional().nullable(),
  catatan_analisis_opd: z.string().min(3, 'Catatan kajian teknis analisis OPD wajib diisi')
});

export const submitOpdAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = opdAnalysisSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi analisis teknis OPD gagal', 422, parseResult.error.format());
    }

    const {
      anggaran_analisis_opd,
      sub_kegiatan,
      jenis_belanja,
      volume_analisis_opd,
      satuan_analisis_opd,
      catatan_analisis_opd
    } = parseResult.data;

    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, status_tahapan, opd_id')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan', 404);
    }

    // Role Guard Spesifik: Jika user adalah peran OPD, pastikan OPD-nya cocok!
    if (req.user.role === 'opd') {
      if (req.user.opd_id !== proposal.opd_id) {
        return errorResponse(res, 'Akses ditolak. Anda hanya berwenang menganalisis proposal yang ditujukan ke OPD Anda.', 403);
      }
    }

    if (proposal.status_tahapan !== 'DITERUSKAN_KE_OPD' && proposal.status_tahapan !== 'SELESAI_ANALISIS_OPD') {
      return errorResponse(
        res,
        `Proposal tidak dapat dianalisis pada tahapan '${proposal.status_tahapan}'`,
        400
      );
    }

    const fromStage = proposal.status_tahapan;
    const toStage = 'SELESAI_ANALISIS_OPD';

    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update({
        anggaran_analisis_opd,
        sub_kegiatan,
        jenis_belanja,
        volume_analisis_opd: volume_analisis_opd || null,
        satuan_analisis_opd: satuan_analisis_opd || null,
        catatan_analisis_opd,
        analyzed_by: req.user.id,
        analyzed_at: new Date().toISOString(),
        status_tahapan: toStage
      })
      .eq('id', id)
      .select('*, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal menyimpan hasil analisis OPD', 500, updateErr.message);
    }

    await createAuditLog({
      proposal_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      anggaran_recorded: anggaran_analisis_opd,
      catatan: catatan_analisis_opd,
      actor_id: req.user.id
    });

    return successResponse(res, updatedProposal, 'Kajian teknis analisis OPD berhasil disimpan');
  } catch (error) {
    console.error('[OPD Analysis Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat menyimpan analisis OPD', 500, error.message);
  }
};

// ============================================================================
// 5. TAHAP KEPUTUSAN TPAD / RENJA (FR-06 & Anggaran Tier 3)
// ============================================================================
const tpadDecisionSchema = z.object({
  decision: z.enum(['MASUK_RENJA', 'TIDAK_MASUK_RENJA'], {
    errorMap: () => ({ message: "Keputusan harus bernilai 'MASUK_RENJA' atau 'TIDAK_MASUK_RENJA'" })
  }),
  anggaran_persetujuan: z.number().optional().nullable(),
  catatan_tpad_renja: z.string().min(3, 'Catatan pertimbangan keputusan TPAD/RENJA wajib diisi')
}).refine((data) => {
  if (data.decision === 'MASUK_RENJA') {
    return typeof data.anggaran_persetujuan === 'number' && data.anggaran_persetujuan > 0;
  }
  return true;
}, {
  message: 'Anggaran Persetujuan wajib diisi dengan nilai lebih besar dari 0 jika status usulan MASUK_RENJA',
  path: ['anggaran_persetujuan']
});

export const decideTpadRenja = async (req, res) => {
  try {
    const { id } = req.params;
    const parseResult = tpadDecisionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return errorResponse(res, 'Validasi keputusan TPAD/RENJA gagal', 422, parseResult.error.format());
    }

    const { decision, anggaran_persetujuan, catatan_tpad_renja } = parseResult.data;

    const { data: proposal, error: fetchErr } = await supabaseAdmin
      .from('proposals')
      .select('id, status_tahapan')
      .eq('id', id)
      .single();

    if (fetchErr || !proposal) {
      return errorResponse(res, 'Proposal tidak ditemukan', 404);
    }

    if (proposal.status_tahapan !== 'SELESAI_ANALISIS_OPD') {
      return errorResponse(
        res,
        `Keputusan TPAD/RENJA hanya dapat ditetapkan setelah OPD menyelesaikan analisis teknis (Status saat ini: ${proposal.status_tahapan})`,
        400
      );
    }

    const fromStage = proposal.status_tahapan;
    const toStage = decision;

    const updatePayload = {
      anggaran_persetujuan: decision === 'MASUK_RENJA' ? anggaran_persetujuan : null,
      catatan_tpad_renja,
      tpad_decided_by: req.user.id,
      tpad_decided_at: new Date().toISOString(),
      status_tahapan: toStage
    };

    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update(updatePayload)
      .eq('id', id)
      .select('*, master_opd:opd_id(id, kode_opd, nama_opd)')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal menyimpan keputusan TPAD/RENJA', 500, updateErr.message);
    }

    await createAuditLog({
      proposal_id: id,
      from_stage: fromStage,
      to_stage: toStage,
      anggaran_recorded: decision === 'MASUK_RENJA' ? anggaran_persetujuan : null,
      catatan: `[Keputusan Akhir: ${decision}] ${catatan_tpad_renja}`,
      actor_id: req.user.id
    });

    return successResponse(res, updatedProposal, `Keputusan akhir TPAD/RENJA berhasil ditetapkan sebagai ${decision}`);
  } catch (error) {
    console.error('[TPAD Renja Decision Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat menetapkan keputusan TPAD/RENJA', 500, error.message);
  }
};

// ============================================================================
// 6. UNGGAH DOKUMEN LAMPIRAN PENDUKUNG PROPOSAL (PDF)
// ============================================================================
export const uploadProposalAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return errorResponse(res, 'Berkas dokumen lampiran wajib diunggah', 400);
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const filePath = `proposals/${id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Pastikan bucket 'attachments' ada di Supabase Storage
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'attachments');
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket('attachments', { public: true });
    }

    // Unggah ke Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      return errorResponse(res, 'Gagal mengunggah berkas ke Supabase Storage', 500, uploadError.message);
    }

    // Dapatkan Public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('attachments')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Simpan URL ke kolom file_lampiran_url
    const { data: updatedProposal, error: updateErr } = await supabaseAdmin
      .from('proposals')
      .update({ file_lampiran_url: publicUrl })
      .eq('id', id)
      .select('id, file_lampiran_url')
      .single();

    if (updateErr) {
      return errorResponse(res, 'Gagal memperbarui URL lampiran proposal', 500, updateErr.message);
    }

    return successResponse(res, {
      fileUrl: publicUrl,
      proposalId: id
    }, 'Dokumen lampiran berhasil diunggah');
  } catch (error) {
    console.error('[Upload Attachment Error]:', error);
    return errorResponse(res, 'Terjadi kesalahan sistem saat mengunggah lampiran', 500, error.message);
  }
};

