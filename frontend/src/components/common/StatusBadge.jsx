import React from 'react';

const STAGE_CONFIG = {
  MASUK_SISTEM: {
    label: 'Masuk Sistem',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500'
  },
  TERVERIFIKASI_BAPPERIDA: {
    label: 'Terverifikasi Bapperida',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-600'
  },
  PROSES_RDP: {
    label: 'Proses RDP',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-600'
  },
  DITERUSKAN_KE_OPD: {
    label: 'Diteruskan ke OPD',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-600'
  },
  SELESAI_ANALISIS_OPD: {
    label: 'Selesai Analisis OPD',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-600'
  },
  MASUK_RENJA: {
    label: 'Masuk RENJA',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600'
  },
  TIDAK_MASUK_RENJA: {
    label: 'Tidak Masuk RENJA',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600'
  }
};

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STAGE_CONFIG[status] || {
    label: status || 'Tidak Diketahui',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400'
  };

  const sizeClasses = size === 'lg' 
    ? 'px-3 py-1 text-sm gap-2' 
    : 'px-2.5 py-0.5 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}

