import React from 'react';
import { DollarSign, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function BudgetComparisonCard({ proposal }) {
  const formatRupiah = (val) => {
    if (val === null || val === undefined) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const bAwal = proposal.anggaran_awal_sipd ? Number(proposal.anggaran_awal_sipd) : null;
  const b1 = proposal.anggaran_proposal ? Number(proposal.anggaran_proposal) : null;
  const b2 = proposal.anggaran_analisis_opd ? Number(proposal.anggaran_analisis_opd) : null;
  const b3 = proposal.anggaran_persetujuan ? Number(proposal.anggaran_persetujuan) : null;

  // Hitung selisih antara Tier 1 (Proposal) dan Tier 3 (Persetujuan Akhir)
  let diffBadge = null;
  if (b1 !== null && b3 !== null) {
    const diff = b3 - b1;
    if (diff > 0) {
      diffBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <TrendingUp size={12} /> +{formatRupiah(diff)}
        </span>
      );
    } else if (diff < 0) {
      diffBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
          <TrendingDown size={12} /> {formatRupiah(diff)}
        </span>
      );
    } else {
      diffBadge = (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
          <Minus size={12} /> Tetap
        </span>
      );
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Komparasi 3-Tier Budgeting</h3>
            <p className="text-xs text-slate-500">Perkembangan alokasi anggaran pada setiap tahapan</p>
          </div>
        </div>
        {diffBadge}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1 */}
        <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Tier 1: Anggaran Proposal
          </span>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(b1)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Ditetapkan pada Verifikasi BAPPERIDA</p>
        </div>

        {/* Tier 2 */}
        <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-100">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
            Tier 2: Anggaran Analisis OPD
          </span>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(b2)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Hasil kajian teknis & survei lapangan OPD</p>
        </div>

        {/* Tier 3 */}
        <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            Tier 3: Anggaran Persetujuan
          </span>
          <p className="text-lg font-bold text-slate-900">{formatRupiah(b3)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Keputusan Akhir Dokumen RENJA</p>
        </div>
      </div>

      {bAwal !== null && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Nilai Usulan Awal pada File SIPD:</span>
          <span className="font-semibold text-slate-700">{formatRupiah(bAwal)}</span>
        </div>
      )}
    </div>
  );
}

