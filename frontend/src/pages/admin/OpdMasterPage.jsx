import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Building2, Search, Plus, Check, X, RefreshCw } from 'lucide-react';

export default function OpdMasterPage() {
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [newKode, setNewKode] = useState('');
  const [newNama, setNewNama] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOpds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/opd', {
        params: { search: search.trim() || undefined, include_inactive: 'true' }
      });
      setOpds(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpds();
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKode.trim() || !newNama.trim()) return;

    setSubmitLoading(true);
    setErrorMsg('');
    try {
      await api.post('/opd', {
        kode_opd: newKode.trim(),
        nama_opd: newNama.trim()
      });
      setModalOpen(false);
      setNewKode('');
      setNewNama('');
      fetchOpds();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal menambahkan Master OPD');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Building2 size={20} />
            </span>
            <h1 className="text-lg font-bold text-slate-800">Master Organisasi Perangkat Daerah (OPD)</h1>
          </div>
          <p className="text-xs text-slate-500">
            Daftar instansi/dinas penanggung jawab usulan pembangunan daerah Kabupaten Banyumas
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Tambah OPD Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama dinas..."
              className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Total: {opds.length} OPD
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Kode OPD</th>
                <th className="py-3 px-4">Nama Perangkat Daerah</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Memuat data master OPD...
                  </td>
                </tr>
              ) : opds.map((opd, idx) => (
                <tr key={opd.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {opd.kode_opd || '-'}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">{opd.nama_opd}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah OPD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Tambah Master OPD Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Singkat OPD</label>
                <input
                  type="text"
                  value={newKode}
                  onChange={(e) => setNewKode(e.target.value)}
                  placeholder="Contoh: DPU, DINDIK"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 uppercase focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Dinas / Badan</label>
                <input
                  type="text"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  placeholder="Contoh: Dinas Pekerjaan Umum"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  {submitLoading ? 'Menyimpan...' : 'Simpan Master OPD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

