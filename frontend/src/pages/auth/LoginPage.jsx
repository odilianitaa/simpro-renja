import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('[Login Error]:', err);
      setErrorMsg(err.message || 'Email atau kata sandi tidak valid. Silakan periksa kembali.');
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk memilih akun demo dengan 1 klik
  const setDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
      <div className="max-w-md w-full">
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white text-2xl font-black shadow-lg shadow-blue-500/30">
            SR
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">SIMPRO RENJA</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sistem Informasi Manajemen Proposal RENJA<br />
            <span className="font-bold text-blue-700">BAPPERIDA KABUPATEN BANYUMAS</span>
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <h2 className="text-base font-bold text-slate-800 mb-1">Masuk ke Sistem</h2>
          <p className="text-xs text-slate-500 mb-6">Gunakan akun yang telah didaftarkan oleh Administrator</p>

          {errorMsg && (
            <div className="p-3 mb-5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@banyumaskab.go.id"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn size={15} />
              <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Pilih Akun Demo Cepat
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount('admin@banyumaskab.go.id', 'AdminBapperida2026!')}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-left transition"
              >
                <p className="text-[11px] font-bold text-red-700">Admin</p>
                <p className="text-[9px] text-red-500">Kelola Sistem</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('staff_bapperida@banyumaskab.go.id', 'StaffBapperida2026!')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition"
              >
                <p className="text-[11px] font-bold text-blue-700">BAPPERIDA</p>
                <p className="text-[9px] text-blue-500">Verif & RENJA</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoAccount('opd_pertanian@banyumaskab.go.id', 'OpdPertanian2026!')}
                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition"
              >
                <p className="text-[11px] font-bold text-emerald-700">OPD</p>
                <p className="text-[9px] text-emerald-500">Dinas Pertanian</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          SIMPRO RENJA &bull; Pemerintah Kabupaten Banyumas
        </p>
      </div>
    </div>
  );
}

