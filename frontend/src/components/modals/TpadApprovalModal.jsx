import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { X, FileCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function TpadApprovalModal({ isOpen, onClose, proposal, onSuccess }) {
  const [decision, setDecision] = useState('MASUK_RENJA');
  const [anggaranPersetujuan, setAnggaranPersetujuan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && proposal) {
      setDecision('MASUK_RENJA');
      // Default nilai anggaran persetujuan mengambil dari analisis OPD, jika ada
      setAnggaranPersetujuan(proposal.anggaran_analisis_opd || proposal.anggaran_proposal || '');
      setCatatan(proposal.catatan_tpad_renja || '');
      setErrorMsg('');
    }
  }, [isOpen, proposal]);

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (decision === 'MASUK_RENJA') {
      const numBudget = parseFloat(String(anggaranPersetujuan).replace(/[^\d]/g, ''));
      if (!numBudget || numBudget <= 0) {
        setErrorMsg('Anggaran Persetujuan (Tier 3) wajib diisi jika usulan disetujui Masuk RENJA');
        return;
      }
    }

    if (!catatan.trim()) {
      setErrorMsg('Catatan pertimbangan penetapan TPAD/RENJA wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        decision,
        catatan_tpad_renja: catatan.trim(),
        anggaran_persetujuan: decision === 'MASUK_RENJA' 
          ? parseFloat(String(anggaranPersetujuan).replace(/[^\d]/g, '')) 
          : null
      };

      await api.post(`/workflow/${proposal.id}/tpad-decision`, payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal menetapkan keputusan TPAD/RENJA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Keputusan Akhir TPAD / RENJA</h3>
              <p className="text-xs text-slate-500">ID Usulan: #{proposal.id_usulan_sipd}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Usulan</label>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {proposal.usulan}
            </p>
          </div>

          {/* Pemilihan Keputusan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Keputusan Penetapan <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                  decision === 'MASUK_RENJA'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="MASUK_RENJA"
                  checked={decision === 'MASUK_RENJA'}
                  onChange={() => setDecision('MASUK_RENJA')}
                  className="sr-only"
                />
                <CheckCircle size={18} className={decision === 'MASUK_RENJA' ? 'text-emerald-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">MASUK RENJA</span>
              </label>

              <label
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                  decision === 'TIDAK_MASUK_RENJA'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="radio"
                  name="decision"
                  value="TIDAK_MASUK_RENJA"
                  checked={decision === 'TIDAK_MASUK_RENJA'}
                  onChange={() => setDecision('TIDAK_MASUK_RENJA')}
                  className="sr-only"
                />
                <XCircle size={18} className={decision === 'TIDAK_MASUK_RENJA' ? 'text-rose-600' : 'text-slate-400'} />
                <span className="text-xs font-bold">TIDAK MASUK RENJA</span>
              </label>
            </div>
          </div>

          {/* Form Anggaran Persetujuan jika MASUK_RENJA */}
          {decision === 'MASUK_RENJA' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anggaran Persetujuan (Tier 3) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">Rp</span>
                <input
                  type="number"
                  value={anggaranPersetujuan}
                  onChange={(e) => setAnggaranPersetujuan(e.target.value)}
                  placeholder="Contoh: 90000000"
                  className="w-full text-xs rounded-lg border border-slate-300 pl-9 p-2.5 focus:border-emerald-500 focus:outline-none font-bold text-slate-900"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Alokasi pagu anggaran definitif yang disahkan pada dokumen Rencana Kerja (RENJA)
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pertimbangan Keputusan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Berikan alasan atau justifikasi pertimbangan keputusan TPAD..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg flex items-center gap-1.5 disabled:opacity-50 ${
                decision === 'MASUK_RENJA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? 'Menyimpan...' : `Tetapkan Sebagai ${decision}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

