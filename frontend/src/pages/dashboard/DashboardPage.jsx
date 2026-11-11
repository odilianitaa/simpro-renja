import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import ProposalTable from '../../components/proposals/ProposalTable';
import {
  FileText,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  FileCheck,
  XCircle,
  DollarSign,
  TrendingUp,
  ArrowRight,
  UploadCloud
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { role, profile, opd } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/proposals/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatRupiah = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const stages = stats?.stages || {};
  const budgets = stats?.budgets || {};

  return (
    <div className="space-y-6">
      {/* Banner Sambutan */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] font-bold uppercase tracking-wider text-blue-100">
            Sistem Informasi Manajemen Proposal RENJA
          </span>
          <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            Selamat Datang, {profile?.full_name || 'Pengguna'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mt-1">
            {role === 'admin' && 'Anda bertindak sebagai Administrator. Kelola file SIPD, master OPD, dan otorisasi pengguna.'}
            {role === 'staff_bapperida' && 'Kelola verifikasi usulan pokir SIPD, proses RDP, dan tetapkan alokasi anggaran RENJA definitif.'}
            {role === 'opd' && `Workspace kajian teknis usulan untuk ${opd?.nama_opd || 'Perangkat Daerah'}.`}
            {role === 'setwan' && 'Pantau usulan pokir yang dibahas dalam Rapat Dengar Pendapat (RDP) Komisi DPRD.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {role === 'admin' && (
              <button
                onClick={() => navigate('/admin/import')}
                className="px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <UploadCloud size={14} />
                <span>Import File Excel SIPD</span>
              </button>
            )}
            <button
              onClick={() => navigate('/proposals')}
              className="px-3.5 py-2 bg-blue-800/80 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <span>Buka Seluruh Usulan</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Metrik Tahapan Usulan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase">Total Usulan</span>
            <FileText size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-800">{loading ? '...' : stats?.totalProposals || 0}</p>
          <span className="text-[10px] text-slate-400">Usulan Ditolak SIPD</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Terverifikasi</span>
            <CheckCircle2 size={16} />
          </div>
          <p className="text-2xl font-black text-blue-700">{loading ? '...' : stages.TERVERIFIKASI_BAPPERIDA || 0}</p>
          <span className="text-[10px] text-blue-400">Oleh BAPPERIDA</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Proses RDP</span>
            <Clock size={16} />
          </div>
          <p className="text-2xl font-black text-purple-700">{loading ? '...' : stages.PROSES_RDP || 0}</p>
          <span className="text-[10px] text-purple-400">Pembahasan Komisi</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Kajian OPD</span>
            <SlidersHorizontal size={16} />
          </div>
          <p className="text-2xl font-black text-amber-700">
            {loading ? '...' : (stages.DITERUSKAN_KE_OPD || 0) + (stages.SELESAI_ANALISIS_OPD || 0)}
          </p>
          <span className="text-[10px] text-amber-500">Analisis Perangkat Daerah</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Masuk RENJA</span>
            <FileCheck size={16} />
          </div>
          <p className="text-2xl font-black text-emerald-700">{loading ? '...' : stages.MASUK_RENJA || 0}</p>
          <span className="text-[10px] text-emerald-500 font-semibold">Disetujui Definitif</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Tidak Masuk</span>
            <XCircle size={16} />
          </div>
          <p className="text-2xl font-black text-rose-700">{loading ? '...' : stages.TIDAK_MASUK_RENJA || 0}</p>
          <span className="text-[10px] text-rose-400">Ditolak TPAD</span>
        </div>
      </div>

      {/* Akumulasi 3-Tier Budgeting */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Anggaran Proposal (Tier 1)
            </span>
            <p className="text-xl font-black text-slate-800">{formatRupiah(budgets.totalAnggaranProposal)}</p>
            <p className="text-[11px] text-slate-500">Hasil verifikasi BAPPERIDA</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Anggaran Analisis OPD (Tier 2)
            </span>
            <p className="text-xl font-black text-slate-800">{formatRupiah(budgets.totalAnggaranAnalisisOpd)}</p>
            <p className="text-[11px] text-slate-500">Hasil kajian teknis dinas terkait</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileCheck size={24} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Anggaran Persetujuan (Tier 3)
            </span>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(budgets.totalAnggaranPersetujuan)}</p>
            <p className="text-[11px] text-emerald-600 font-medium">Sah masuk Dokumen RENJA 2026</p>
          </div>
        </div>
      </div>

      {/* Tabel Usulan Terkini */}
      <ProposalTable
        title="Usulan Terbaru di SIMPRO RENJA"
        subtitle="Pantau dan tindak lanjuti usulan sesuai wewenang Anda"
      />
    </div>
  );
}

