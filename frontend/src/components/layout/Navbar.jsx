import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import { LogOut, User, Building2, Bell } from 'lucide-react';

export default function Navbar() {
  const { profile, role, opd, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Sistem Informasi Manajemen Proposal RENJA
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* OPD Tag jika user memiliki OPD */}
        {opd && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
            <Building2 size={14} className="text-blue-600" />
            <span className="truncate max-w-[200px]" title={opd.nama_opd}>
              {opd.nama_opd}
            </span>
          </div>
        )}

        {/* Profil Pengguna */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {profile?.full_name || 'Pengguna'}
            </p>
            <div className="mt-0.5">
              <RoleBadge role={role} />
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>

          {/* Tombol Logout */}
          <button
            onClick={logout}
            title="Keluar dari Sistem"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

