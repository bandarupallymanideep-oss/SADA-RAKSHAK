import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertsContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toast } from './Toast';

export const Layout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { recentAlert, dismissRecentAlert } = useAlerts();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          <span>INITIALIZING SADARAKSHAK CONTROL ROOM...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopBar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        
        {/* Scrollable page view */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#090d16] to-[#090d16]">
          <Outlet />
        </main>
      </div>

      {/* Real-time Incident Detection Toast */}
      <Toast alert={recentAlert} onDismiss={dismissRecentAlert} />
    </div>
  );
};

