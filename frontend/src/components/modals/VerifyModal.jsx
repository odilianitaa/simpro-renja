import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function VerifyModal({ isOpen, onClose, proposal, onSuccess }) {
  const [opdList, setOpdList] = useState([]);
  const [selectedOpdId, setSelectedOpdId] = useState('');
  const [anggaranProposal, setAnggaranProposal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Ambil daftar Master OPD untuk dropdown
      api.get('/opd')
        .then(res => setOpdList(res.data || []))
        .catch(err => console.error(err));

      if (proposal) {
        setSelectedOpdId(proposal.opd_id || '');
        setAnggaranProposal(proposal.anggaran_proposal || proposal.anggaran_awal_sipd || '');
        setCatatan(proposal.catatan_verifikasi_bapperida || '');
      }
      setErrorMsg('');
    }
  }, [isOpen, proposal]);

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedOpdId) {
      setErrorMsg('Pilih OPD tujuan usulan');
      return;
    }

    const numBudget = parseFloat(String(anggaranProposal).replace(/[^\d]/g, ''));
    if (!numBudget || numBudget <= 0) {
      setErrorMsg('Anggaran Proposal wajib diisi dengan nominal lebih besar dari 0');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/workflow/${proposal.id}/verify`, {
        opd_id: selectedOpdId,
        anggaran_proposal: numBudget,
        catatan_verifikasi_bapperida: catatan
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal memverifikasi usulan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Verifikasi Usulan BAPPERIDA</h3>
              <p className="text-xs text-slate-500">ID Usulan SIPD: #{proposal.id_usulan_sipd}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
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
              OPD Tujuan <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedOpdId}
              onChange={(e) => setSelectedOpdId(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Pilih OPD Penanggung Jawab --</option>
              {opdList.map((opd) => (
                <option key={opd.id} value={opd.id}>
                  {opd.nama_opd} ({opd.kode_opd || 'OPD'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anggaran Proposal (Tier 1) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">Rp</span>
              <input
                type="number"
                value={anggaranProposal}
                onChange={(e) => setAnggaranProposal(e.target.value)}
                placeholder="Contoh: 75000000"
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 p-2.5 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Nilai anggaran resmi hasil verifikasi Staff BAPPERIDA</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Verifikasi</label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Tambahkan catatan pertimbangan verifikasi..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-blue-500 focus:outline-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Verifikasi Usulan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

