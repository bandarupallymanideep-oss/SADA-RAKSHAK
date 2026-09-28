import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Camera as CameraIcon, 
  Video, 
  AlertTriangle, 
  Search, 
  Filter, 
  Activity, 
  RefreshCw, 
  ArrowRight
} from 'lucide-react';
import { useCameras } from '../context/CameraContext';
import { useAlerts } from '../context/AlertsContext';
import { StatCard } from '../components/StatCard';
import { CameraCard } from '../components/CameraCard';
import { CameraModal } from '../components/CameraModal';
import type { Camera, CameraInput, CameraStatus } from '../api/types';
import { BACKEND_URL } from '../api/client';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { cameras, isLoading: camerasLoading, addCamera, editCamera, removeCamera, changeStatus, refreshCameras, backendOnline, error: camerasError } = useCameras();
  const { stats, alerts } = useAlerts();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCameraForEdit, setSelectedCameraForEdit] = useState<Camera | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleOpenAddModal = () => {
    setSelectedCameraForEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (camera: Camera) => {
    setSelectedCameraForEdit(camera);
    setModalOpen(true);
  };

  const handleSaveCamera = async (data: CameraInput) => {
    if (selectedCameraForEdit) {
      return editCamera(selectedCameraForEdit.id, data);
    }
    return addCamera(data);
  };

  const handleDeleteCamera = async (id: string) => {
    if (window.confirm('Remove this camera? Its detection session is stopped. Saved accident files are kept.')) {
      await removeCamera(id);
    }
  };

  const handleToggleStatus = (id: string, status: CameraStatus) => changeStatus(id, status);

  // Filter cameras
  const filteredCameras = cameras.filter(cam => {
    const matchesSearch = cam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cam.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || cam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live stats
  const totalCameras = cameras.length;
  const activeStreams = cameras.filter(c => c.status === 'Processing').length;
  const accidentsDetectedToday = stats?.accidentsDetectedToday ?? 0;
  const accidentsLastHour = stats?.accidentsLastHour ?? 0;
  const pendingAlerts = alerts.filter(a => a.status === 'New').length;

  return (
    <div className="space-y-7">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight font-sans">
            CCTV Surveillance & Sensor Deployment
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add CCTV / IP cameras (RTSP) or accident videos and run YOLO11 accident detection on the SADARAKSHAK backend
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refreshCameras()}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh stream statuses"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold tracking-wide shadow-lg shadow-red-600/30 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Camera Source</span>
          </button>
        </div>
      </div>

      {backendOnline === false && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs font-mono">
          <strong className="text-red-200">Backend offline.</strong> {camerasError || `Cannot reach ${BACKEND_URL}.`} Start it with:
          <code className="block mt-1 text-red-200">cd backend &amp;&amp; {'venv\\Scripts\\activate'} &amp;&amp; python -m uvicorn app:app --host 0.0.0.0 --port 8000</code>
        </div>
      )}

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cameras"
          value={totalCameras}
          icon={CameraIcon}
          change={`${cameras.filter(c => c.sourceType === 'rtsp').length} RTSP • ${cameras.filter(c => c.sourceType === 'upload').length} Video`}
          trend="neutral"
          variant="slate"
          subtitle="Registered surveillance nodes"
        />

        <StatCard
          title="Active Streams"
          value={activeStreams}
          icon={Video}
          change={`${Math.round((activeStreams / (totalCameras || 1)) * 100)}% monitored`}
          trend="up"
          variant="emerald"
          subtitle="Cameras with YOLO11 detection running"
        />

        <StatCard
          title="Accidents Detected Today"
          value={accidentsDetectedToday}
          icon={AlertTriangle}
          change={`${accidentsLastHour} in the last hour`}
          trend="alert"
          variant="red"
          subtitle="Machine vision collision alerts"
        />

        <StatCard
          title="Pending Alerts"
          value={pendingAlerts}
          icon={Activity}
          change={pendingAlerts > 0 ? 'Action required' : 'All clear'}
          trend={pendingAlerts > 0 ? 'down' : 'neutral'}
          variant={pendingAlerts > 0 ? 'amber' : 'cyan'}
          subtitle="Unacknowledged incident queue"
        />
      </div>

      {/* Control bar: Search, Filter, Live Monitor shortcut */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cameras by name, location, ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <Filter className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">All Statuses ({totalCameras})</option>
              <option value="Processing">Processing ({cameras.filter(c => c.status === 'Processing').length})</option>
              <option value="Connected">Connected ({cameras.filter(c => c.status === 'Connected').length})</option>
              <option value="Offline">Offline ({cameras.filter(c => c.status === 'Offline').length})</option>
            </select>
          </div>
        </div>

        {/* Shortcut to Live Monitor */}
        <button
          type="button"
          onClick={() => navigate('/live')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <span>Open Live Grid Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Camera Grid Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              DEPLOYED CAMERA NODES ({filteredCameras.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-500">
              Auto-synced to Live Monitor
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono hidden md:block">
            Click the status badge to start / stop AI detection
          </p>
        </div>

        {camerasLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(n => (
              <div key={n} className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 aspect-video animate-pulse" />
            ))}
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-12 text-center">
            <CameraIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold text-slate-200">No Cameras Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No cameras match your current search and filter settings.' 
                : 'No cameras deployed yet. Add your first camera source using the button below.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Camera Source</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteCamera}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Adding / Editing Camera */}
      <CameraModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCamera}
        cameraToEdit={selectedCameraForEdit}
        totalCamerasCount={cameras.length}
      />
    </div>
  );
};
