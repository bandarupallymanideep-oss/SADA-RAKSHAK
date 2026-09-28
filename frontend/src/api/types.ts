export type CameraStatus = 'Connected' | 'Offline' | 'Processing';

export type SourceType = 'rtsp' | 'upload';

/** Backend detection session states */
export type DetectionState =
  | 'connecting'
  | 'connected'
  | 'detecting'
  | 'accident'
  | 'reconnecting'
  | 'disconnected'
  | 'error'
  | 'completed'
  | 'stopped';

export interface DetectionStatus {
  id: string;
  cameraId?: string;
  cameraName?: string;
  source: string; // credential-masked
  sourceType: 'rtsp' | 'file';
  state: DetectionState;
  active: boolean;
  message: string;
  error?: { code: string; message: string } | null;
  startedAt: string;
  endedAt?: string | null;
  framesProcessed: number;
  totalFrames?: number | null;
  progress?: number | null;
  inferences: number;
  inferenceFps: number;
  inferenceMs: number;
  captureFps: number;
  sourceFps?: number | null;
  resolution?: string | null;
  reconnectAttempts: number;
  accidentInFrame: boolean;
  lastAccidentConfidence: number;
  recordingAccidentId?: string | null;
  accidentIds: string[];
  streamUrl: string;
}

export interface ConnectionTestResult {
  success: boolean;
  status: string;
  code: string;
  message: string;
  sourceType?: 'stream' | 'file';
  resolution?: string;
  fps?: number | null;
  codec?: string | null;
  elapsedMs?: number;
  testedAt?: string;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  sourceType: SourceType;
  /** RTSP URL with the password masked (rtsp://user:***@host/...) or a server video path */
  sourceUrl?: string;
  hasCredentials?: boolean;
  fileName?: string | null;
  autoStart?: boolean;
  status: CameraStatus;
  fps: number;
  resolution: string;
  bitrate?: string;
  thumbnailUrl?: string | null;
  lastDetected?: string;
  lastTest?: ConnectionTestResult | null;
  detection?: DetectionStatus | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CameraInput {
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  sourceType: SourceType;
  sourceUrl: string;
  fileName?: string | null;
  startDetection?: boolean;
}

export type AccidentStatus = 'New' | 'Acknowledged' | 'Resolved';

export type AccidentSeverity = 'Minor' | 'Moderate' | 'High' | 'Critical';

export interface AccidentRecord {
  id: string; // "accident0", "accident1", ...
  cameraId: string;
  cameraName: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: string; // ISO string (UTC)
  endedAt?: string;
  snapshotImage: string; // absolute URL of accidentN.jpg
  videoClipUrl: string; // absolute URL of accidentN.mp4
  clipFile?: string;
  confidenceScore: number; // e.g. 94.2
  status: AccidentStatus;
  severity: AccidentSeverity;
  vehiclesInvolved: number;
  collisionType: string;
  accidentType?: string; // YOLO class name
  recording?: boolean; // clip still being written
  durationSeconds?: number;
  clipFrames?: number;
  videoOffsetSeconds?: number | null;
  sourceType?: string;
  source?: string;
  detectionHits?: number;
  model?: string;
  notes?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SampleClip {
  filename: string;
  size_mb: number;
  url: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'Control Room Chief' | 'Senior Dispatcher' | 'Incident Analyst' | 'System Operator';
  avatarUrl?: string;
  token?: string;
}

export interface DashboardStats {
  totalCameras: number;
  activeStreams: number;
  accidentsDetectedToday: number;
  accidentsLastHour: number;
  pendingAlerts: number;
  resolvedToday: number;
}

export interface BackendHealth {
  status: string;
  app: string;
  model: {
    path: string;
    type: string;
    device: string;
    classes: Record<string, string>;
    accidentClassIds: number[];
    confidenceThreshold: number;
  };
  activeSessions: number;
  accidentsSaved: number;
}

export interface AlertFilterOptions {
  cameraId?: string;
  location?: string;
  status?: string;
  severity?: string;
  search?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
}
