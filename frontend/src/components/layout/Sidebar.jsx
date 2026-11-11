import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Users2,
  Building2,
  FileCheck,
  Send,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';

export default function Sidebar() {
  const { role } = useAuth();

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-blue-600 text-white shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
          SR
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">SIMPRO RENJA</h1>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            Kabupaten Banyumas
          </p>
        </div>
      </div>

      {/* Navigation Menus */}
      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {/* Menu Utama */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Menu Utama
          </p>
          <div className="space-y-1">
            <NavLink to="/" end className={navItemClass}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/proposals" className={navItemClass}>
              <FileText size={18} />
              <span>Daftar Usulan</span>
            </NavLink>
          </div>
        </div>

        {/* Menu Khusus Admin */}
        {role === 'admin' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Administrasi Sistem
            </p>
            <div className="space-y-1">
              <NavLink to="/admin/import" className={navItemClass}>
                <FileSpreadsheet size={18} />
                <span>Import SIPD</span>
              </NavLink>
              <NavLink to="/admin/opd" className={navItemClass}>
                <Building2 size={18} />
                <span>Master OPD</span>
              </NavLink>
              <NavLink to="/admin/users" className={navItemClass}>
                <Users2 size={18} />
                <span>Kelola Pengguna</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Menu Khusus Staff BAPPERIDA */}
        {role === 'staff_bapperida' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Alur Kerja Usulan
            </p>
            <div className="space-y-1">
              <NavLink to="/workflow/verification" className={navItemClass}>
                <CheckCircle2 size={18} />
                <span>Verifikasi Usulan</span>
              </NavLink>
              <NavLink to="/workflow/rdp" className={navItemClass}>
                <Users2 size={18} />
                <span>Proses RDP</span>
              </NavLink>
              <NavLink to="/workflow/tpad" className={navItemClass}>
                <FileCheck size={18} />
                <span>Keputusan TPAD / RENJA</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Menu Khusus OPD */}
        {role === 'opd' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Kajian Teknis
            </p>
            <div className="space-y-1">
              <NavLink to="/workflow/opd-workspace" className={navItemClass}>
                <SlidersHorizontal size={18} />
                <span>Workspace OPD</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Menu Khusus Setwan */}
        {role === 'setwan' && (
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Sekretariat DPRD
            </p>
            <div className="space-y-1">
              <NavLink to="/workflow/rdp-monitoring" className={navItemClass}>
                <Users2 size={18} />
                <span>Pemantauan RDP</span>
              </NavLink>
            </div>
          </div>
        )}

        {/* Laporan & Rekap */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Laporan
          </p>
          <div className="space-y-1">
            <NavLink to="/reports" className={navItemClass}>
              <BarChart3 size={18} />
              <span>Rekapitulasi Usulan</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-center">
        <p className="text-[11px] text-slate-400 font-medium">BAPPERIDA Banyumas &copy; 2026</p>
        <p className="text-[10px] text-slate-400">v1.0.0 Production</p>
      </div>
    </aside>
  );
}

