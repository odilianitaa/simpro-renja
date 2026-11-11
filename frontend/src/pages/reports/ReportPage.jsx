import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { exportProposalsToExcel, exportProposalsToPdf } from '../../utils/exportHelpers';
import StatusBadge from '../../components/common/StatusBadge';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Building2,
  DollarSign,
  TrendingUp,
  FileCheck,
  RefreshCw,
  Search
} from 'lucide-react';

export default function ReportPage() {
  const [summary, setSummary] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [opdList, setOpdList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedOpd, setSelectedOpd] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      // 1. Ambil Summary
      const sumRes = await api.get('/reports/summary', {
        params: {
          opd_id: selectedOpd || undefined,
          tahun: selectedYear || undefined
        }
      });
      setSummary(sumRes.data);

      // 2. Ambil Dataset Lengkap untuk Ekspor & Pratinjau
      const expRes = await api.get('/reports/export-data', {
        params: {
          opd_id: selectedOpd || undefined,
          status_tahapan: selectedStage || undefined,
          tahun: selectedYear || undefined,
          search: search.trim() || undefined
        }
      });
      setExportData(expRes.data || []);
    } catch (err) {
      console.error('[Fetch Report Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/opd').then(res => setOpdList(res.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedOpd, selectedStage, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const formatRupiah = (val) => {
    if (!val) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totals = summary?.totals || {};
  const byOpd = summary?.byOpd || [];

  return (
    <div className="space-y-6">
      {/* Header & Tombol Ekspor */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <BarChart3 size={20} />
            </span>
            <h1 className="text-lg font-bold text-slate-800">Laporan & Rekapitulasi SIMPRO RENJA</h1>
          </div>
          <p className="text-xs text-slate-500">
            Rekapitulasi komparatif usulan pokir SIPD dan perbandingan 3 tahapan anggaran
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Ekspor Excel */}
          <button
            onClick={() => exportProposalsToExcel(exportData, { selectedOpd, selectedStage, selectedYear })}
            disabled={exportData.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          {/* Tombol Ekspor PDF */}
          <button
            onClick={() => exportProposalsToPdf(exportData, { selectedOpd, selectedStage, selectedYear })}
            disabled={exportData.length === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download size={15} />
            <span>Cetak PDF Dinas</span>
          </button>
        </div>
      </div>

      {/* Filter Kriteria */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 shrink-0">
          <Filter size={15} className="text-blue-600" />
          <span>Filter Laporan:</span>
        </div>

        <select
          value={selectedOpd}
          onChange={(e) => setSelectedOpd(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white max-w-xs focus:outline-none focus:border-blue-500 truncate"
        >
          <option value="">-- Seluruh Perangkat Daerah --</option>
          {opdList.map((opd) => (
            <option key={opd.id} value={opd.id}>
              {opd.nama_opd}
            </option>
          ))}
        </select>

        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:border-blue-500"
        >
          <option value="">-- Seluruh Tahapan Status --</option>
          <option value="MASUK_SISTEM">Masuk Sistem</option>
          <option value="TERVERIFIKASI_BAPPERIDA">Terverifikasi Bapperida</option>
          <option value="PROSES_RDP">Proses RDP</option>
          <option value="DITERUSKAN_KE_OPD">Diteruskan ke OPD</option>
          <option value="SELESAI_ANALISIS_OPD">Selesai Analisis OPD</option>
          <option value="MASUK_RENJA">Disetujui Masuk RENJA</option>
          <option value="TIDAK_MASUK_RENJA">Tidak Masuk RENJA</option>
        </select>

        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pengusul, usulan, lokasi..."
            className="w-full text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </form>

        <button
          onClick={fetchReports}
          className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-500 shrink-0"
          title="Segarkan Laporan"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Ringkasan Akumulasi Anggaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Usulan Terdata
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1">{totals.totalProposals || 0}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Usulan dalam cakupan filter</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Total Anggaran Proposal (Tier 1)
          </span>
          <p className="text-xl font-black text-blue-700 mt-1">{formatRupiah(totals.totalAnggaranProposal)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hasil Verifikasi BAPPERIDA</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Total Anggaran Analisis (Tier 2)
          </span>
          <p className="text-xl font-black text-indigo-700 mt-1">{formatRupiah(totals.totalAnggaranAnalisisOpd)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Hasil Kajian Teknis Lapangan</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total Anggaran RENJA (Tier 3)
          </span>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(totals.totalAnggaranPersetujuan)}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">Disetujui Masuk Dokumen RENJA</p>
        </div>
      </div>

      {/* Tabel 1: Rekapitulasi per Perangkat Daerah */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">Rekapitulasi Pagu per Perangkat Daerah (OPD)</h2>
          <p className="text-xs text-slate-500">Perbandingan jumlah usulan dan total 3 tingkatan anggaran per OPD</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Perangkat Daerah</th>
                <th className="py-3 px-4 text-center">Total Usulan</th>
                <th className="py-3 px-4 text-right">Pagu Proposal (Tier 1)</th>
                <th className="py-3 px-4 text-right">Pagu Analisis (Tier 2)</th>
                <th className="py-3 px-4 text-right">Pagu Persetujuan (Tier 3)</th>
                <th className="py-3 px-4 text-center">Disetujui RENJA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {byOpd.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data rekapitulasi OPD.
                  </td>
                </tr>
              ) : (
                byOpd.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.nama_opd}
                      {item.kode_opd !== '-' && (
                        <span className="ml-1.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.kode_opd}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {item.total_usulan} Usulan
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-blue-700">
                      {formatRupiah(item.total_anggaran_proposal)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-indigo-700">
                      {formatRupiah(item.total_anggaran_analisis)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatRupiah(item.total_anggaran_persetujuan)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200">
                        {item.masuk_renja}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabel 2: Rincian Seluruh Usulan Terformat */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Rincian Data Usulan Terfilter ({exportData.length})</h2>
            <p className="text-xs text-slate-500">Pratinjau data yang akan dicetak pada berkas Excel dan PDF</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-700 text-[11px] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">ID SIPD</th>
                <th className="py-3 px-3">Pengusul</th>
                <th className="py-3 px-3">Rincian Usulan</th>
                <th className="py-3 px-3">OPD</th>
                <th className="py-3 px-3 text-right">Tier 1 (BAPPERIDA)</th>
                <th className="py-3 px-3 text-right">Tier 2 (OPD)</th>
                <th className="py-3 px-3 text-right">Tier 3 (RENJA)</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Memuat rincian usulan...
                  </td>
                </tr>
              ) : exportData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada usulan yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                exportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{row.no}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      #{row.id_usulan_sipd}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[140px] truncate" title={row.pengusul}>
                      {row.pengusul}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate" title={row.usulan}>
                      {row.usulan}
                    </td>
                    <td className="py-2.5 px-3 max-w-[150px] truncate" title={row.nama_opd}>
                      {row.nama_opd}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-blue-700">
                      {formatRupiah(row.anggaran_proposal)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-indigo-700">
                      {formatRupiah(row.anggaran_analisis_opd)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-emerald-700">
                      {formatRupiah(row.anggaran_persetujuan)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={row.status_tahapan} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
