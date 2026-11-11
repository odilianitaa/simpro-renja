import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import StatusTimeline from '../../components/proposals/StatusTimeline';
import BudgetComparisonCard from '../../components/proposals/BudgetComparisonCard';
import VerifyModal from '../../components/modals/VerifyModal';
import RdpProcessModal from '../../components/modals/RdpProcessModal';
import OpdAnalysisModal from '../../components/modals/OpdAnalysisModal';
import TpadApprovalModal from '../../components/modals/TpadApprovalModal';
import {
  ArrowLeft,
  Building2,
  Calendar,
  MapPin,
  User,
  Paperclip,
  UploadCloud,
  FileCheck2,
  History,
  CheckCircle,
  FileText
} from 'lucide-react';

export default function ProposalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/proposals/${id}`);
      setProposal(res.data);
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal memuat detail proposal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/workflow/${id}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchDetail();
    } catch (err) {
      alert(err.customMessage || 'Gagal mengunggah berkas lampiran');
    } finally {
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Memuat detail usulan proposal...</p>
      </div>
    );
  }

  if (errorMsg || !proposal) {
    return (
      <div className="bg-white rounded-xl p-8 text-center max-w-lg mx-auto border border-red-200">
        <p className="text-sm font-bold text-red-700">{errorMsg || 'Proposal tidak ditemukan'}</p>
        <button
          onClick={() => navigate('/proposals')}
          className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg"
        >
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        {/* Action Buttons Sesuai Role & Stage */}
        <div className="flex flex-wrap items-center gap-2">
          {(role === 'admin' || role === 'staff_bapperida') && proposal.status_tahapan === 'MASUK_SISTEM' && (
            <button
              onClick={() => setActiveModal('verify')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Verifikasi Proposal
            </button>
          )}

          {(role === 'admin' || role === 'staff_bapperida') && proposal.status_tahapan === 'TERVERIFIKASI_BAPPERIDA' && (
            <button
              onClick={() => setActiveModal('rdp')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Proses Pembahasan RDP
            </button>
          )}

          {(role === 'admin' || role === 'staff_bapperida' || role === 'opd') && proposal.status_tahapan === 'DITERUSKAN_KE_OPD' && (
            <button
              onClick={() => setActiveModal('opd-analysis')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Input Kajian Teknis OPD
            </button>
          )}

          {(role === 'admin' || role === 'staff_bapperida') && proposal.status_tahapan === 'SELESAI_ANALISIS_OPD' && (
            <button
              onClick={() => setActiveModal('tpad')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Penetapan TPAD / RENJA
            </button>
          )}
        </div>
      </div>

      {/* Main Proposal Card Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                ID SIPD: #{proposal.id_usulan_sipd}
              </span>
              <StatusBadge status={proposal.status_tahapan} size="lg" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{proposal.usulan}</h1>
          </div>
        </div>

        {/* Quick Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <User size={16} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">Pengusul:</span>
              <span className="font-semibold text-slate-800">{proposal.pengusul}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <MapPin size={16} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">Lokasi:</span>
              <span className="font-semibold text-slate-800">{proposal.alamat_lokasi || '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Building2 size={16} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[11px] text-slate-400 block">OPD Penanggung Jawab:</span>
              <span className="font-semibold text-slate-800">
                {proposal.master_opd?.nama_opd || proposal.opd_tujuan_akhir_sipd || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Stepper / Timeline */}
      <StatusTimeline currentStatus={proposal.status_tahapan} logs={proposal.logs} />

      {/* 3-Tier Budgeting Card */}
      <BudgetComparisonCard proposal={proposal} />

      {/* Grid Informasi Teknis & Rekomendasi SIPD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Detail Asli SIPD */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileText size={16} className="text-blue-600" />
            <span>Atribut Usulan SIPD (21 Kolom)</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Uraian Permasalahan:</span>
              <p className="mt-0.5 text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                {proposal.masalah || 'Tidak ada deskripsi masalah.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-500 block">Volume & Satuan Awal:</span>
                <span className="text-slate-800 font-medium">
                  {proposal.volume ? `${proposal.volume} ${proposal.satuan || ''}` : '-'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">Tanggal Pengajuan:</span>
                <span className="text-slate-800 font-medium">{proposal.tanggal_usul || '-'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-slate-500 block">OPD Awal (SIPD):</span>
                <span className="text-slate-800">{proposal.opd_tujuan_awal_sipd || '-'}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-500 block">OPD Akhir (SIPD):</span>
                <span className="text-slate-800">{proposal.opd_tujuan_akhir_sipd || '-'}</span>
              </div>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Catatan SIPD (Ditolak):</span>
              <p className="mt-0.5 text-rose-800 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                {proposal.catatan_sipd || 'Tidak ada catatan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Hasil Kajian & Dokumen Pendukung */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <FileCheck2 size={16} className="text-emerald-600" />
            <span>Hasil Verifikasi & Kajian Alur</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Sub Kegiatan (Kajian OPD):</span>
              <span className="text-slate-900 font-medium">{proposal.sub_kegiatan || '-'}</span>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Jenis Belanja:</span>
              <span className="text-slate-900 font-medium">{proposal.jenis_belanja || '-'}</span>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Catatan Verifikasi BAPPERIDA:</span>
              <p className="mt-0.5 text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {proposal.catatan_verifikasi_bapperida || '-'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Catatan Pembahasan RDP:</span>
              <p className="mt-0.5 text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {proposal.catatan_proses_rdp || '-'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Catatan Analisis Teknis OPD:</span>
              <p className="mt-0.5 text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">
                {proposal.catatan_analisis_opd || '-'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 block">Catatan Akhir TPAD / RENJA:</span>
              <p className="mt-0.5 text-emerald-800 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 font-medium">
                {proposal.catatan_tpad_renja || '-'}
              </p>
            </div>

            {/* Berkas Lampiran Dokumen */}
            <div className="pt-2 border-t border-slate-100">
              <span className="font-semibold text-slate-700 block mb-1.5">Dokumen Lampiran (PDF):</span>
              {proposal.file_lampiran_url ? (
                <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <Paperclip size={16} className="text-blue-600 shrink-0" />
                    <span className="text-blue-900 font-medium truncate">Dokumen Pendukung Usulan</span>
                  </div>
                  <a
                    href={proposal.file_lampiran_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:text-blue-900 font-bold underline shrink-0"
                  >
                    Buka PDF
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-400">Belum ada dokumen lampiran</span>
                  <label className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center gap-1">
                    <UploadCloud size={14} />
                    <span>{uploadingFile ? 'Mengunggah...' : 'Unggah PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Riwayat Log Transisi Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2 mb-4">
          <History size={16} className="text-blue-600" />
          <span>Riwayat Perubahan Status & Audit Log</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Perubahan Tahapan</th>
                <th className="py-2.5 px-3">Anggaran Tercatat</th>
                <th className="py-2.5 px-3">Pelaksana / Aktor</th>
                <th className="py-2.5 px-3">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposal.logs?.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                    {new Date(log.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {log.from_stage ? <StatusBadge status={log.from_stage} /> : <span className="text-slate-400">-</span>}
                      <span className="text-slate-400">&rarr;</span>
                      <StatusBadge status={log.to_stage} />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                    {log.anggaran_recorded
                      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(log.anggaran_recorded)
                      : '-'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{log.actor?.full_name || 'Sistem'}</span>
                    <span className="block text-[10px] text-slate-400">{log.actor?.role || ''}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs">{log.catatan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <VerifyModal
        isOpen={activeModal === 'verify'}
        proposal={proposal}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDetail}
      />
      <RdpProcessModal
        isOpen={activeModal === 'rdp'}
        proposal={proposal}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDetail}
      />
      <OpdAnalysisModal
        isOpen={activeModal === 'opd-analysis'}
        proposal={proposal}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDetail}
      />
      <TpadApprovalModal
        isOpen={activeModal === 'tpad'}
        proposal={proposal}
        onClose={() => setActiveModal(null)}
        onSuccess={fetchDetail}
      />
    </div>
  );
}

