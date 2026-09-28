import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Edit3,
  Trash2,
  Radio,
  Upload,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Play,
  Wifi,
  Loader2,
  Camera as CameraIcon
} from 'lucide-react';
import type { Camera, CameraStatus, ConnectionTestResult } from '../api/types';
import { testConnection } from '../api/cameras';
import { getDetectionBadge } from '../utils/detectionStatus';

interface CameraCardProps {
  camera: Camera;
  onEdit: (camera: Camera) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, status: CameraStatus) => Promise<unknown> | void;
}

export const CameraCard: React.FC<CameraCardProps> = ({
  camera,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ConnectionTestResult | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  const statusConfig = {
    Connected: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500', label: 'Connected', icon: CheckCircle2 },
    Processing: { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/40', dot: 'bg-amber-500 animate-ping', label: 'AI Processing', icon: Cpu },
    Offline: { badge: 'bg-slate-800 text-slate-400 border-slate-700', dot: 'bg-slate-500', label: 'Offline', icon: AlertCircle }
  };
  const currentStatus = statusConfig[camera.status] || statusConfig.Offline;
  const det = camera.detection;
  const detBadge = getDetectionBadge(det);

  const handleToggleDetection = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await onToggleStatus(camera.id, camera.status === 'Processing' ? 'Connected' : 'Processing');
    } catch (err: any) {
      setMessage({ success: false, status: 'error', code: err?.code || 'ERROR', message: err?.message || 'Failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setMessage(null);
    setMessage(await testConnection({ cameraId: camera.id }));
    setThumbFailed(false);
    setBusy(false);
  };

  const errorText = det && ['error', 'disconnected', 'reconnecting'].includes(det.state) ? det.error?.message || det.message : null;

  return (
    <div className="group rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between">
      <div>
        <div className="relative aspect-video bg-black overflow-hidden select-none">
          {camera.thumbnailUrl && !thumbFailed ? (
            <img
              src={camera.thumbnailUrl}
              alt={camera.name}
              onError={() => setThumbFailed(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-600">
              <CameraIcon className="w-9 h-9 mb-2" />
              <span className="text-[10px] font-mono uppercase tracking-widest">No preview yet</span>
              <span className="text-[10px] font-mono text-slate-700 mt-0.5">Test connection or start detection</span>
            </div>
          )}

          <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono z-10 pointer-events-none">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border font-semibold ${detBadge.className}`}>
              <span className={`w-2 h-2 rounded-full ${detBadge.dot}`} />
              <span>{detBadge.label}</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-sm border border-white/10 text-slate-300">
              {camera.fps > 0 ? `${camera.fps} FPS` : '-- FPS'}
            </div>
          </div>

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 backdrop-blur-sm">
            {camera.sourceType === 'rtsp' ? (
              <>
                <Radio className="w-3 h-3 text-red-400" />
                <span>RTSP STREAM</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 text-amber-400" />
                <span>VIDEO FILE</span>
              </>
            )}
          </div>

          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/live')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/40 transition-all cursor-pointer transform hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>View Live Stream</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">{camera.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{camera.location}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1 truncate" title={camera.sourceUrl}>
                {camera.sourceType === 'rtsp' ? camera.sourceUrl : camera.fileName || camera.sourceUrl}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleDetection}
              disabled={busy}
              title={camera.status === 'Processing' ? 'Click to stop AI accident detection' : 'Click to start AI accident detection'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border transition-colors cursor-pointer shrink-0 disabled:opacity-60 ${currentStatus.badge}`}
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />}
              <span>{currentStatus.label}</span>
            </button>
          </div>

          {(message || errorText) && (
            <div
              className={`mt-3 p-2 rounded-lg border text-[11px] font-mono leading-snug ${
                message?.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {message
                ? message.success
                  ? `${message.message} (${message.resolution}${message.fps ? ` @ ${message.fps} FPS` : ''})`
                  : message.message
                : errorText}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
            <div>
              <span className="text-slate-500 text-[10px] block">RESOLUTION</span>
              <span className="text-slate-300 font-semibold">{camera.resolution}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">AI ACCIDENT DETECTION</span>
              <span className={camera.status === 'Processing' ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                {camera.status === 'Processing' ? 'ACTIVE SCAN' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
        <div className="text-[11px] font-mono text-slate-400">ID: {camera.id}</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Test connection"
          >
            <Wifi className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(camera)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit camera"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(camera.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Remove camera"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
