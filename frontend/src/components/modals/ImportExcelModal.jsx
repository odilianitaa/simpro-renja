import React, { useState } from 'react';
import api from '../../lib/api';
import { X, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function ImportExcelModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExecute, setLoadingExecute] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg('');
    setPreviewData(null);
    setLoadingPreview(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(res.data);
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal membaca berkas Excel');
      setFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecute = async () => {
    if (!file) return;

    setLoadingExecute(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/import/execute', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal mengeksekusi import data SIPD');
    } finally {
      setLoadingExecute(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200 my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Import Data Verifikasi Pokir SIPD</h3>
              <p className="text-xs text-slate-500">Filter otomatis usulan berstatus "Ditolak" (PRD Bab 2)</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Area Drag & Drop File */}
          {!file && (
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center transition bg-slate-50/50">
              <UploadCloud size={40} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Pilih Berkas Excel SIPD</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">Format berkas didukung: .xlsx atau .xls (Maks. 25 MB)</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer transition">
                <span>Cari Berkas...</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Loading Preview */}
          {loadingPreview && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-700">Menganalisis & Menyaring 21 Kolom Data Excel...</p>
              <p className="text-[11px] text-slate-400 mt-1">Menyaring hanya baris dengan STATUS == "Ditolak"</p>
            </div>
          )}

          {/* Hasil Pratinjau */}
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-900">{previewData.filename}</p>
                    <p className="text-[11px] text-blue-700">{(previewData.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreviewData(null); }}
                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline"
                >
                  Ganti Berkas
                </button>
              </div>

              {/* Kartu Ringkasan Filter */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Total Baris</span>
                  <span className="text-lg font-bold text-slate-800">{previewData.summary.totalRowsExcel}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-center">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Ditolak (Diimpor)</span>
                  <span className="text-lg font-bold text-emerald-800">{previewData.summary.totalDitolak}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 block">Status Diabaikan</span>
                  <span className="text-lg font-bold text-slate-600">{previewData.summary.totalIgnored}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-center">
                  <span className="text-[11px] text-amber-700 font-semibold block">Fallback OPD</span>
                  <span className="text-lg font-bold text-amber-800">{previewData.summary.fallbackOpdCount}</span>
                </div>
              </div>

              {/* Sampel Tabel Data */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Pratinjau Usulan yang Akan Masuk ({previewData.sampleDataDitolak?.length} dari {previewData.summary.totalDitolak}):
                </p>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-2">ID Usulan</th>
                        <th className="p-2">Pengusul</th>
                        <th className="p-2">Usulan</th>
                        <th className="p-2">OPD Tujuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.sampleDataDitolak?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono font-semibold">#{item.id_usulan_sipd}</td>
                          <td className="p-2 truncate max-w-[120px]">{item.pengusul}</td>
                          <td className="p-2 truncate max-w-[200px]" title={item.usulan}>{item.usulan}</td>
                          <td className="p-2 truncate max-w-[150px]">{item.opd_tujuan_akhir_sipd || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!previewData || loadingExecute}
              onClick={handleExecute}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
            >
              {loadingExecute ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengimpor Data...</span>
                </>
              ) : (
                <>
                  <span>Eksekusi Simpan ke Sistem</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

