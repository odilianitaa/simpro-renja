import React, { useState } from 'react';
import ProposalTable from '../../components/proposals/ProposalTable';
import RdpProcessModal from '../../components/modals/RdpProcessModal';

export default function RdpMonitoringPage() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionClick = (action, proposal) => {
    if (action === 'rdp') {
      setSelectedProposal(proposal);
      setModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <ProposalTable
        key={refreshKey}
        initialStage="PROSES_RDP"
        title="Pemantauan Pembahasan RDP Komisi DPRD"
        subtitle="Daftar usulan pokir yang sedang dalam proses pembahasan RDP dan disposisi ke Perangkat Daerah"
        onActionClick={handleActionClick}
      />

      <RdpProcessModal
        isOpen={modalOpen}
        proposal={selectedProposal}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </div>
  );
}

