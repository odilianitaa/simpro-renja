import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import RoleBadge from '../../components/common/RoleBadge';
import { Users2, Plus, Search, Building2, X, RefreshCw } from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [opds, setOpds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('opd');
  const [selectedOpdId, setSelectedOpdId] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    api.get('/opd').then(res => setOpds(res.data || [])).catch(console.error);
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');

    try {
      await api.post('/users', {
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role,
        opd_id: role === 'opd' ? selectedOpdId : null
      });

      setModalOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('opd');
      setSelectedOpdId('');
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.customMessage || 'Gagal mendaftarkan pengguna baru');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users2 size={20} />
            </span>
            <h1 className="text-lg font-bold text-slate-800">Manajemen Pengguna Sistem</h1>
          </div>
          <p className="text-xs text-slate-500">
            Kelola akun, peran wewenang (RBAC), dan penautan pengguna ke Perangkat Daerah
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Total Pengguna Terdaftar: {users.length}</span>
          <button onClick={fetchUsers} className="p-1 text-slate-400 hover:text-slate-600">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Email Login</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Tautan Perangkat Daerah</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {u.master_opd?.nama_opd || <span className="text-slate-400 italic">Tidak terikat OPD</span>}
                  </td>
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

      {/* Modal Tambah Pengguna */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Tambah Akun Pengguna Baru</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Kom"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email Resmi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@banyumaskab.go.id"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Peran Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="opd">Perangkat Daerah (OPD)</option>
                  <option value="staff_bapperida">Staff BAPPERIDA</option>
                  <option value="setwan">Sekretariat DPRD (Setwan)</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>

              {role === 'opd' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Perangkat Daerah</label>
                  <select
                    value={selectedOpdId}
                    onChange={(e) => setSelectedOpdId(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:border-blue-500 bg-white"
                    required
                  >
                    <option value="">-- Pilih OPD --</option>
                    {opds.map(opd => (
                      <option key={opd.id} value={opd.id}>{opd.nama_opd}</option>
                    ))}
                  </select>
                </div>
              )}

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
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {submitLoading ? 'Mendaftarkan...' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

