import React, { useState } from 'react';
import ProposalTable from '../../components/proposals/ProposalTable';
import VerifyModal from '../../components/modals/VerifyModal';
import RdpProcessModal from '../../components/modals/RdpProcessModal';
import OpdAnalysisModal from '../../components/modals/OpdAnalysisModal';
import TpadApprovalModal from '../../components/modals/TpadApprovalModal';

export default function ProposalListPage() {
  const [activeModal, setActiveModal] = useState(null); // 'verify' | 'rdp' | 'opd-analysis' | 'tpad'
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleActionClick = (actionType, proposal) => {
    setSelectedProposal(proposal);
    setActiveModal(actionType);
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setSelectedProposal(null);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <ProposalTable
        key={refreshKey}
        title="Daftar Lengkap Proposal RENJA"
        subtitle="Kelola usulan, verifikasi data, kajian teknis, dan penetapan RENJA"
        onActionClick={handleActionClick}
      />

      {/* Modal Verifikasi BAPPERIDA */}
      <VerifyModal
        isOpen={activeModal === 'verify'}
        proposal={selectedProposal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Pembahasan RDP */}
      <RdpProcessModal
        isOpen={activeModal === 'rdp'}
        proposal={selectedProposal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Kajian Teknis OPD */}
      <OpdAnalysisModal
        isOpen={activeModal === 'opd-analysis'}
        proposal={selectedProposal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Penetapan TPAD / RENJA */}
      <TpadApprovalModal
        isOpen={activeModal === 'tpad'}
        proposal={selectedProposal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}

