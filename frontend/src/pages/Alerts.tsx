import React, { useState } from 'react';
import { CheckCheck, Download } from 'lucide-react';
import { useAlerts } from '../context/AlertsContext';
import { useCameras } from '../context/CameraContext';
import { AlertFilterBar } from '../components/AlertFilterBar';
import { AlertTable } from '../components/AlertTable';
import type { AlertFilterOptions } from '../api/types';

export const Alerts: React.FC = () => {
  const { alerts, markAcknowledged, markResolved, newAlertsCount } = useAlerts();
  const { cameras } = useCameras();

  const [filters, setFilters] = useState<AlertFilterOptions>({});
  const [isExporting, setIsExporting] = useState(false);

  // Filter alerts according to filter state with useMemo
  const filteredAlerts = React.useMemo(() => {
    const now = Date.now();
    const todayPrefix = new Date().toISOString().slice(0, 10);

    return alerts.filter(record => {
      // Camera filter
      if (filters.cameraId && filters.cameraId !== 'all' && record.cameraId !== filters.cameraId) {
        return false;
      }
      // Location filter
      if (filters.location && filters.location !== 'all' && record.location !== filters.location) {
        return false;
      }
      // Date Range filter
      if (filters.dateRange && filters.dateRange !== 'all') {
        const recordTime = new Date(record.timestamp).getTime();
        if (filters.dateRange === 'today') {
          const oneDayMs = 24 * 60 * 60 * 1000;
          const isTodayDate = record.timestamp.startsWith(todayPrefix);
          if (!isTodayDate && (now - recordTime > oneDayMs)) {
            return false;
          }
        } else if (filters.dateRange === 'week') {
          const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
          if (now - recordTime > sevenDaysMs) {
            return false;
          }
        } else if (filters.dateRange === 'month') {
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
          if (now - recordTime > thirtyDaysMs) {
            return false;
          }
        }
      }
      // Status filter
      if (filters.status && filters.status !== 'all' && record.status.toLowerCase() !== filters.status.toLowerCase()) {
        return false;
      }
      // Severity filter
      if (filters.severity && filters.severity !== 'all' && record.severity.toLowerCase() !== filters.severity.toLowerCase()) {
        return false;
      }
      // Search query
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matches = record.id.toLowerCase().includes(q) ||
          record.location.toLowerCase().includes(q) ||
          record.cameraName.toLowerCase().includes(q) ||
          record.collisionType.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [alerts, filters]);


  const handleAcknowledgeAll = async () => {
    const unacknowledged = alerts.filter(a => a.status === 'New');
    if (unacknowledged.length === 0) return;
    if (window.confirm(`Mark all ${unacknowledged.length} pending alert(s) as Acknowledged?`)) {
      for (const a of unacknowledged) {
        await markAcknowledged(a.id);
      }
    }
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const headers = ['Accident ID', 'Camera ID', 'Camera Name', 'Location', 'Timestamp', 'Confidence Score', 'Severity', 'Collision Type', 'Status'];
      const rows = filteredAlerts.map(a => [
        a.id,
        a.cameraId,
        `"${a.cameraName}"`,
        `"${a.location}"`,
        a.timestamp,
        a.confidenceScore,
        a.severity,
        `"${a.collisionType}"`,
        a.status
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sadarakshak_accidents_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight font-sans">
              Alerts & Accident Footage
            </h2>
            {newAlertsCount > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse">
                {newAlertsCount} ACTION REQUIRED
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Accidents detected by YOLO11 with the automatically saved footage (backend/detected_accidents)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {newAlertsCount > 0 && (
            <button
              type="button"
              onClick={handleAcknowledgeAll}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Acknowledge All ({newAlertsCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || filteredAlerts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-mono transition-colors cursor-pointer disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <AlertFilterBar
        filters={filters}
        onChange={setFilters}
        cameras={cameras}
        availableLocations={Array.from(new Set(alerts.map(a => a.location)))}
        totalRecordsCount={alerts.length}
      />

      {/* Accident Records Table */}
      <AlertTable
        alerts={filteredAlerts}
        onMarkAcknowledged={(id) => markAcknowledged(id)}
        onMarkResolved={(id) => markResolved(id)}
      />
    </div>
  );
};
