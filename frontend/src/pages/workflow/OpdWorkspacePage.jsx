import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ProposalTable from '../../components/proposals/ProposalTable';
import OpdAnalysisModal from '../../components/modals/OpdAnalysisModal';

export default function OpdWorkspacePage() {
  const { opd } = useAuth();
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionClick = (action, proposal) => {
    if (action === 'opd-analysis') {
      setSelectedProposal(proposal);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <ProposalTable
        key={refreshKey}
        fixedOpdId={opd?.id}
        title={`Workspace Usulan Teknis: ${opd?.nama_opd || 'Perangkat Daerah'}`}
        subtitle="Lakukan kajian teknis lapangan, input Sub Kegiatan, Jenis Belanja, dan tetapkan Anggaran Analisis OPD (Tier 2)"
        onActionClick={handleActionClick}
      />

      <OpdAnalysisModal
        isOpen={modalOpen}
        proposal={selectedProposal}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

