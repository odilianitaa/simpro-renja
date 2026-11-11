import React, { useState } from 'react';
import ProposalTable from '../../components/proposals/ProposalTable';
import TpadApprovalModal from '../../components/modals/TpadApprovalModal';

export default function TpadRenjaPage() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionClick = (action, proposal) => {
    if (action === 'tpad') {
      setSelectedProposal(proposal);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <ProposalTable
        key={refreshKey}
        initialStage="SELESAI_ANALISIS_OPD"
        title="Pengelolaan Keputusan Akhir TPAD / RENJA"
        subtitle="Tetapkan usulan yang disetujui (MASUK_RENJA) beserta alokasi Anggaran Persetujuan (Tier 3) atau TIDAK_MASUK_RENJA"
        onActionClick={handleActionClick}
      />

      <TpadApprovalModal
        isOpen={modalOpen}
        proposal={selectedProposal}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

