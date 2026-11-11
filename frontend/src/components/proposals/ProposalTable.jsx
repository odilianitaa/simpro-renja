import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  Users2,
  SlidersHorizontal,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export default function ProposalTable({
  initialStage = '',
  fixedOpdId = null,
  title = 'Daftar Proposal RENJA',
  subtitle = 'Kelola usulan hasil verifikasi SIPD',
  onActionClick = null
}) {
  const navigate = useNavigate();
  const { role } = useAuth();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState(initialStage);
  const [selectedOpd, setSelectedOpd] = useState(fixedOpdId || '');
  const [opdList, setOpdList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalRows: 0, totalPages: 1 });

  // Ambil daftar OPD untuk filter
  useEffect(() => {
    api.get('/opd')
      .then(res => setOpdList(res.data || []))
      .catch(err => console.error(err));
  }, []);

  const fetchProposals = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: search.trim(),
        status_tahapan: selectedStage || undefined,
        opd_id: fixedOpdId || selectedOpd || undefined
      };

      const res = await api.get('/proposals', { params });
      setProposals(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('[Fetch Proposals Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals(1);
  }, [selectedStage, selectedOpd, fixedOpdId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProposals(1);
  };

  const formatRupiah = (val) => {
    if (!val) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Filter Bar */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={() => fetchProposals(pagination.page)}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Form Pencarian */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID usulan, pengusul, kamus usulan, atau lokasi..."
              className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-4 py-2 focus:border-blue-500 focus:outline-none"
            />
          </form>

          {/* Filter Status Tahapan (Jika tidak di-lock) */}
          {!initialStage && (
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- Semua Status Tahapan --</option>
              <option value="MASUK_SISTEM">Masuk Sistem</option>
              <option value="TERVERIFIKASI_BAPPERIDA">Terverifikasi Bapperida</option>
              <option value="PROSES_RDP">Proses RDP</option>
              <option value="DITERUSKAN_KE_OPD">Diteruskan ke OPD</option>
              <option value="SELESAI_ANALISIS_OPD">Selesai Analisis OPD</option>
              <option value="MASUK_RENJA">Masuk RENJA</option>
              <option value="TIDAK_MASUK_RENJA">Tidak Masuk RENJA</option>
            </select>
          )}

          {/* Filter OPD (Khusus Admin/BAPPERIDA/Setwan) */}
          {!fixedOpdId && (role === 'admin' || role === 'staff_bapperida' || role === 'setwan') && (
            <select
              value={selectedOpd}
              onChange={(e) => setSelectedOpd(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white max-w-xs focus:border-blue-500 focus:outline-none truncate"
            >
              <option value="">-- Semua OPD Tujuan --</option>
              {opdList.map(opd => (
                <option key={opd.id} value={opd.id}>{opd.nama_opd}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => fetchProposals(1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Terapkan
          </button>
        </div>
      </div>

      {/* Tabel Data Proposal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs divide-y divide-slate-200">
          <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">ID Usulan</th>
              <th className="py-3 px-4">Pengusul & Lokasi</th>
              <th className="py-3 px-4">Rincian Usulan</th>
              <th className="py-3 px-4">OPD Tujuan</th>
              <th className="py-3 px-4">Anggaran</th>
              <th className="py-3 px-4">Status Tahapan</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <span>Memuat data usulan...</span>
                </td>
              </tr>
            ) : proposals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <p className="font-semibold text-slate-600">Tidak ada usulan yang ditemukan</p>
                  <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau filter tahapan</p>
                </td>
              </tr>
            ) : (
              proposals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    #{item.id_usulan_sipd}
                    <span className="block text-[10px] font-normal text-slate-400">
                      {item.tanggal_usul || '-'}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-[180px]">
                    <p className="font-semibold text-slate-800 truncate" title={item.pengusul}>
                      {item.pengusul}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate" title={item.alamat_lokasi}>
                      {item.alamat_lokasi || '-'}
                    </p>
                  </td>

                  <td className="py-3 px-4 max-w-[260px]">
                    <p className="font-medium text-slate-900 line-clamp-2" title={item.usulan}>
                      {item.usulan}
                    </p>
                  </td>

                  <td className="py-3 px-4 max-w-[160px]">
                    <span className="text-slate-700 font-medium block truncate" title={item.master_opd?.nama_opd}>
                      {item.master_opd?.nama_opd || item.opd_tujuan_akhir_sipd || '-'}
                    </span>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    {item.anggaran_persetujuan ? (
                      <div>
                        <span className="text-[10px] text-emerald-600 font-bold block">Persetujuan RENJA:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(item.anggaran_persetujuan)}</span>
                      </div>
                    ) : item.anggaran_analisis_opd ? (
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold block">Analisis OPD:</span>
                        <span className="font-bold text-indigo-700">{formatRupiah(item.anggaran_analisis_opd)}</span>
                      </div>
                    ) : item.anggaran_proposal ? (
                      <div>
                        <span className="text-[10px] text-blue-600 font-bold block">Proposal:</span>
                        <span className="font-bold text-blue-700">{formatRupiah(item.anggaran_proposal)}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status_tahapan} />
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Tombol Lihat Detail */}
                      <button
                        onClick={() => navigate(`/proposals/${item.id}`)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Lihat Detail Lengkap"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Aksi Spesifik berdasarkan Tahapan & Role */}
                      {(role === 'admin' || role === 'staff_bapperida') && item.status_tahapan === 'MASUK_SISTEM' && (
                        <button
                          onClick={() => onActionClick?.('verify', item)}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200"
                        >
                          Verifikasi
                        </button>
                      )}

                      {(role === 'admin' || role === 'staff_bapperida') && item.status_tahapan === 'TERVERIFIKASI_BAPPERIDA' && (
                        <button
                          onClick={() => onActionClick?.('rdp', item)}
                          className="px-2 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200"
                        >
                          RDP
                        </button>
                      )}

                      {(role === 'admin' || role === 'staff_bapperida' || role === 'opd') && item.status_tahapan === 'DITERUSKAN_KE_OPD' && (
                        <button
                          onClick={() => onActionClick?.('opd-analysis', item)}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200"
                        >
                          Kajian OPD
                        </button>
                      )}

                      {(role === 'admin' || role === 'staff_bapperida') && item.status_tahapan === 'SELESAI_ANALISIS_OPD' && (
                        <button
                          onClick={() => onActionClick?.('tpad', item)}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200"
                        >
                          TPAD / RENJA
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <p>
          Menampilkan <span className="font-semibold text-slate-800">{proposals.length}</span> dari{' '}
          <span className="font-semibold text-slate-800">{pagination.totalRows}</span> total usulan
        </p>

        <div className="flex items-center gap-2">
          <button
            disabled={pagination.page <= 1 || loading}
            onClick={() => fetchProposals(pagination.page - 1)}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Halaman {pagination.page} dari {pagination.totalPages || 1}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages || loading}
            onClick={() => fetchProposals(pagination.page + 1)}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

