import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProposalListPage from './pages/proposals/ProposalListPage';
import ProposalDetailPage from './pages/proposals/ProposalDetailPage';
import ImportSipdPage from './pages/admin/ImportSipdPage';
import OpdMasterPage from './pages/admin/OpdMasterPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import VerificationPage from './pages/workflow/VerificationPage';
import RdpMonitoringPage from './pages/workflow/RdpMonitoringPage';
import OpdWorkspacePage from './pages/workflow/OpdWorkspacePage';
import TpadRenjaPage from './pages/workflow/TpadRenjaPage';
import ReportPage from './pages/reports/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rute Publik */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rute Terproteksi dengan AppLayout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Halaman Dashboard & Daftar Proposal (Semua Role Terautentikasi) */}
            <Route path="/" element={<DashboardPage />} />
            <Route path="/proposals" element={<ProposalListPage />} />
            <Route path="/proposals/:id" element={<ProposalDetailPage />} />

            {/* Khusus Administrator */}
            <Route
              path="/admin/import"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ImportSipdPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/opd"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <OpdMasterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />

            {/* Khusus Staff BAPPERIDA */}
            <Route
              path="/workflow/verification"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff_bapperida']}>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflow/rdp"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff_bapperida']}>
                  <RdpMonitoringPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflow/tpad"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff_bapperida']}>
                  <TpadRenjaPage />
                </ProtectedRoute>
              }
            />

            {/* Khusus Perangkat Daerah (OPD) */}
            <Route
              path="/workflow/opd-workspace"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff_bapperida', 'opd']}>
                  <OpdWorkspacePage />
                </ProtectedRoute>
              }
            />

            {/* Khusus Sekretariat DPRD (Setwan) */}
            <Route
              path="/workflow/rdp-monitoring"
              element={
                <ProtectedRoute allowedRoles={['admin', 'staff_bapperida', 'setwan']}>
                  <RdpMonitoringPage />
                </ProtectedRoute>
              }
            />

            {/* Laporan & Rekapitulasi */}
            <Route path="/reports" element={<ReportPage />} />
          </Route>

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
