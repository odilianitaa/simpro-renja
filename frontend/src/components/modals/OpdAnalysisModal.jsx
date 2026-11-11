import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { X, SlidersHorizontal, AlertCircle, Save } from 'lucide-react';

export default function OpdAnalysisModal({ isOpen, onClose, proposal, onSuccess }) {
  const [subKegiatan, setSubKegiatan] = useState('');
  const [jenisBelanja, setJenisBelanja] = useState('');
  const [volume, setVolume] = useState('');
  const [satuan, setSatuan] = useState('');
  const [anggaranAnalisis, setAnggaranAnalisis] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen && proposal) {
      setSubKegiatan(proposal.sub_kegiatan || '');
      setJenisBelanja(proposal.jenis_belanja || '');
      setVolume(proposal.volume_analisis_opd || proposal.volume || '');
      setSatuan(proposal.satuan_analisis_opd || proposal.satuan || '');
      setAnggaranAnalisis(proposal.anggaran_analisis_opd || proposal.anggaran_proposal || '');
      setCatatan(proposal.catatan_analisis_opd || '');
      setErrorMsg('');
    }
  }, [isOpen, proposal]);

  if (!isOpen || !proposal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const numBudget = parseFloat(String(anggaranAnalisis).replace(/[^\d]/g, ''));
    if (isNaN(numBudget) || numBudget < 0) {
      setErrorMsg('Anggaran Analisis OPD wajib diisi dengan angka minimal 0');
      return;
    }

    if (!subKegiatan.trim() || !jenisBelanja.trim()) {
      setErrorMsg('Sub Kegiatan dan Jenis Belanja wajib diisi');
      return;
    }

    if (!catatan.trim()) {
      setErrorMsg('Catatan kajian teknis analisis OPD wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/workflow/${proposal.id}/opd-analysis`, {
        anggaran_analisis_opd: numBudget,
        sub_kegiatan: subKegiatan.trim(),
        jenis_belanja: jenisBelanja.trim(),
        volume_analisis_opd: volume ? parseFloat(volume) : null,
        satuan_analisis_opd: satuan.trim() || null,
        catatan_analisis_opd: catatan.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal menyimpan analisis teknis OPD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <SlidersHorizontal size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Kajian Teknis Analisis OPD</h3>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sub Kegiatan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subKegiatan}
                onChange={(e) => setSubKegiatan(e.target.value)}
                placeholder="Contoh: Pembangunan Sistem Irigasi..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jenis Belanja <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jenisBelanja}
                onChange={(e) => setJenisBelanja(e.target.value)}
                placeholder="Contoh: Belanja Hibah Barang..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Volume Hasil Kajian</label>
              <input
                type="number"
                step="any"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="Contoh: 100"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                value={satuan}
                onChange={(e) => setSatuan(e.target.value)}
                placeholder="Contoh: Meter, Unit, Paket"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Anggaran Analisis OPD (Tier 2) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">Rp</span>
              <input
                type="number"
                value={anggaranAnalisis}
                onChange={(e) => setAnggaranAnalisis(e.target.value)}
                placeholder="Contoh: 85000000"
                className="w-full text-xs rounded-lg border border-slate-300 pl-9 p-2.5 focus:border-indigo-500 focus:outline-none font-semibold text-slate-900"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nilai riil hasil survei harga pasar dan rencana teknis perangkat daerah
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Kajian Teknis Lapangan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Jelaskan kesesuaian lokasi, urgensi, ketersediaan lahan, dan justifikasi anggaran..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? 'Menyimpan...' : 'Simpan Analisis OPD'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

