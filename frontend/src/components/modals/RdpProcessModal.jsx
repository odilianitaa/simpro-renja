import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { X, Users2, AlertCircle, Send } from 'lucide-react';

export default function RdpProcessModal({ isOpen, onClose, proposal, onSuccess }) {
  const [catatanRdp, setCatatanRdp] = useState('');
  const [catatanSetwan, setCatatanSetwan] = useState('');
  const [forwardImmediately, setForwardImmediately] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && proposal) {
      setCatatanRdp(proposal.catatan_proses_rdp || '');
      setCatatanSetwan(proposal.catatan_setwan_rdp || '');
      setErrorMsg('');
    }
  }, [isOpen, proposal]);

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!catatanRdp.trim()) {
      setErrorMsg('Catatan pembahasan RDP wajib diisi');
      return;
    }

    setLoading(true);
    try {
      // 1. Simpan pembahasan RDP
      await api.post(`/workflow/${proposal.id}/rdp-process`, {
        catatan_proses_rdp: catatanRdp,
        catatan_setwan_rdp: catatanSetwan
      });

      // 2. Jika opsi teruskan ke OPD dicentang, eksekusi disposisi
      if (forwardImmediately) {
        await api.post(`/workflow/${proposal.id}/forward-opd`, {
          catatan_disposisi: `Diteruskan ke OPD setelah pembahasan RDP: ${catatanRdp}`
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal memproses tahapan RDP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Proses Pembahasan RDP</h3>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pembahasan RDP <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={catatanRdp}
              onChange={(e) => setCatatanRdp(e.target.value)}
              placeholder="Masukkan kesimpulan atau hasil pembahasan RDP Komisi DPRD..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Pendukung Setwan (Opsional)
            </label>
            <textarea
              rows={2}
              value={catatanSetwan}
              onChange={(e) => setCatatanSetwan(e.target.value)}
              placeholder="Catatan dari pihak Sekretariat DPRD..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-lg">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={forwardImmediately}
                onChange={(e) => setForwardImmediately(e.target.checked)}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-xs font-medium text-purple-900">
                Langsung teruskan usulan ke OPD tujuan (<span className="font-semibold">{proposal.master_opd?.nama_opd || 'OPD Terkait'}</span>)
              </span>
            </label>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} />
              {loading ? 'Memproses...' : forwardImmediately ? 'Simpan & Teruskan ke OPD' : 'Simpan Pembahasan RDP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

