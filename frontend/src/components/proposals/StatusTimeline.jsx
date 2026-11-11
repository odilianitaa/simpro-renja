import React from 'react';
import { Check, Clock, X, AlertCircle } from 'lucide-react';

const STAGES_ORDER = [
  { id: 'MASUK_SISTEM', label: '1. Masuk Sistem' },
  { id: 'TERVERIFIKASI_BAPPERIDA', label: '2. Verifikasi BAPPERIDA' },
  { id: 'PROSES_RDP', label: '3. Pembahasan RDP' },
  { id: 'DITERUSKAN_KE_OPD', label: '4. Kajian OPD' },
  { id: 'FINAL_RENJA', label: '5. Keputusan RENJA' }
];

export default function StatusTimeline({ currentStatus, logs = [] }) {
  const getStageIndex = (status) => {
    switch (status) {
      case 'MASUK_SISTEM': return 0;
      case 'TERVERIFIKASI_BAPPERIDA': return 1;
      case 'PROSES_RDP': return 2;
      case 'DITERUSKAN_KE_OPD': return 3;
      case 'SELESAI_ANALISIS_OPD': return 3;
      case 'MASUK_RENJA':
      case 'TIDAK_MASUK_RENJA': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);
  const isRejected = currentStatus === 'TIDAK_MASUK_RENJA';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      <h3 className="text-sm font-bold text-slate-800 mb-6">Visualisasi Perkembangan Tahapan Usulan</h3>

      <div className="relative">
        <div className="flex items-center justify-between">
          {STAGES_ORDER.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFinalStage = idx === 4;

            let circleClasses = 'bg-slate-100 text-slate-400 border-slate-300';
            let labelClasses = 'text-slate-400';

            if (isCompleted) {
              circleClasses = 'bg-blue-600 text-white border-blue-600';
              labelClasses = 'text-blue-600 font-semibold';
            } else if (isCurrent) {
              if (isFinalStage && isRejected) {
                circleClasses = 'bg-rose-600 text-white border-rose-600 animate-pulse';
                labelClasses = 'text-rose-600 font-bold';
              } else if (isFinalStage && currentStatus === 'MASUK_RENJA') {
                circleClasses = 'bg-emerald-600 text-white border-emerald-600';
                labelClasses = 'text-emerald-600 font-bold';
              } else {
                circleClasses = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100';
                labelClasses = 'text-blue-600 font-bold';
              }
            }

            return (
              <div key={stage.id} className="flex-1 flex flex-col items-center relative text-center">
                {/* Garis Penghubung */}
                {idx > 0 && (
                  <div
                    className={`absolute top-4 -left-1/2 w-full h-1 -z-0 ${
                      idx <= currentIndex ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Bulatan Step */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 transition ${circleClasses}`}
                >
                  {isCompleted ? (
                    <Check size={14} />
                  ) : isCurrent ? (
                    isFinalStage && isRejected ? <X size={14} /> : <Clock size={14} />
                  ) : (
                    idx + 1
                  )}
                </div>

                {/* Label Step */}
                <span className={`text-[11px] sm:text-xs mt-2 max-w-[100px] leading-tight ${labelClasses}`}>
                  {isFinalStage && isCurrent
                    ? currentStatus === 'MASUK_RENJA'
                      ? '5. Masuk RENJA'
                      : '5. Tidak Masuk'
                    : stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

