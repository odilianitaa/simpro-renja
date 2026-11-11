import React from 'react';

const ROLE_CONFIG = {
  admin: {
    label: 'Administrator',
    bg: 'bg-red-50 text-red-700 border-red-200'
  },
  staff_bapperida: {
    label: 'Staff BAPPERIDA',
    bg: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  opd: {
    label: 'Perangkat Daerah (OPD)',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  setwan: {
    label: 'Sekretariat DPRD (Setwan)',
    bg: 'bg-purple-50 text-purple-700 border-purple-200'
  }
};

export default function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || {
    label: role,
    bg: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.bg}`}>
      {config.label}
    </span>
  );
}

