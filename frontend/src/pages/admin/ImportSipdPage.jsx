import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import ImportExcelModal from '../../components/modals/ImportExcelModal';
import { UploadCloud, FileSpreadsheet, RefreshCw, Calendar, User } from 'lucide-react';

export default function ImportSipdPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/import/history');
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet size={20} />
            </span>
            <h1 className="text-lg font-bold text-slate-800">Import Berkas SIPD Pokir</h1>
          </div>
          <p className="text-xs text-slate-500">
            Saring otomatis data usulan berstatus <strong>"Ditolak"</strong> dan masukkan ke dalam SIMPRO RENJA
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <UploadCloud size={16} />
          <span>Upload File Excel SIPD</span>
        </button>
      </div>

      {/* Riwayat Batch Import */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Riwayat Batch Import</h2>
            <p className="text-xs text-slate-500">Daftar berkas Excel yang pernah diunggah ke dalam sistem</p>
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Segarkan Riwayat"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Berkas</th>
                <th className="py-3 px-4">Total Baris Excel</th>
                <th className="py-3 px-4">Usulan Ditolak Diimpor</th>
                <th className="py-3 px-4">Diupload Oleh</th>
                <th className="py-3 px-4">Waktu Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Memuat riwayat...</span>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada riwayat berkas import SIPD.
                  </td>
                </tr>
              ) : (
                history.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet size={16} className="text-emerald-600 shrink-0" />
                      <span>{batch.filename}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">
                      {batch.total_rows_excel.toLocaleString('id-ID')} Baris
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {batch.total_ditolak_imported.toLocaleString('id-ID')} Usulan
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {batch.profiles?.full_name || 'Administrator'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(batch.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload */}
      <ImportExcelModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchHistory}
      />
    </div>
  );
}

