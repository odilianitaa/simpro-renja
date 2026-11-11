import React, { useState } from 'react';
import ProposalTable from '../../components/proposals/ProposalTable';
import VerifyModal from '../../components/modals/VerifyModal';

export default function VerificationPage() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionClick = (action, proposal) => {
    if (action === 'verify') {
      setSelectedProposal(proposal);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <ProposalTable
        key={refreshKey}
        initialStage="MASUK_SISTEM"
        title="Antrean Verifikasi Proposal BAPPERIDA"
        subtitle="Daftar usulan baru yang siap diverifikasi kelayakan dan penetapan Anggaran Proposal (Tier 1)"
        onActionClick={handleActionClick}
      />

      <VerifyModal
        isOpen={modalOpen}
        proposal={selectedProposal}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

