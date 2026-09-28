# SADARAKSHAK — Real-Time Road Accident Detection and Monitoring System

SADARAKSHAK accepts a CCTV/IP-camera **RTSP stream** or an **uploaded accident video**, runs the trained
**YOLO11** accident model (`backend/model/best.pt`) on the backend, detects accidents automatically,
**saves the accident footage** (`backend/detected_accidents/accidentN.mp4`) and shows the live detection
and the saved footage in the React dashboard.

```
IP Camera / CCTV ──► RTSP stream ─┐
                                  ├─► FastAPI backend ─► OpenCV frames ─► YOLO11 ─► accident?
Uploaded / sample video ──────────┘         │                                        │
                                            │ annotated MJPEG (live view)            ▼
                                            ▼                          detected_accidents/accidentN.mp4 (+ .jpg, .json)
                                   React dashboard  ◄──── /api/accidents ◄───────────┘
                                   (Live Monitor, Alerts & Violations)
```

* **Live view path:** RTSP / video → backend session → annotated **MJPEG** → `<img>` in the browser.
  Browsers cannot play `rtsp://`, and no FFmpeg / MediaMTX installation is required.
* **Detection path:** RTSP / video → OpenCV → YOLO11 → accident confirmed → H.264 clip saved → Alerts.
  YOLO always runs on the server, never in the browser.

## Model

| | |
|---|---|
| File | `backend/model/best.pt` (reused as-is) |
| Architecture | YOLO11m (`yolo11m.yaml`), Ultralytics `detect`, trained at 640 px |
| Classes | 0 bike, 1 bike_bike_accident, 2 bike_object_accident, 3 bike_person_accident, 4 car, 5 car_bike_accident, 6 car_car_accident, 7 car_object_accident, 8 car_person_accident, 9 person |
| Accident classes | 1, 2, 3, 5, 6, 7, 8 |
| Trigger | accident class with confidence ≥ **0.85** in ≥ 2 of the last 5 inferences |
| Clip | 3 s before the accident → until 3 s after the last detection (max 30 s), boxes drawn |

All values can be overridden with environment variables (see `backend/sadarakshak/constant/application.py`,
e.g. `SADARAKSHAK_CONFIDENCE_THRESHOLD=0.8`).

## Run

**Backend** (Windows):
```bat
cd /d C:\Users\banda\OneDrive\Desktop\SADARAKSHAK\backend
venv\Scripts\activate
python -m uvicorn app:app --host 0.0.0.0 --port 8000
```
Health check: <http://localhost:8000/health> · API docs: <http://localhost:8000/docs>

**Frontend**:
```bat
cd /d C:\Users\banda\OneDrive\Desktop\SADARAKSHAK\frontend
npm install
npm run dev
```
Open the URL Vite prints (normally <http://localhost:5173>). The backend URL is configured in
`frontend/.env`: `VITE_BACKEND_URL=http://localhost:8000`.

## Test

```bat
cd backend
venv\Scripts\activate
python run_backend_test.py                                   :: model + accident.mp4 + invalid RTSP + API
python run_backend_test.py --max-frames 900                   :: quicker
python run_backend_test.py --rtsp rtsp://192.168.1.100:554/stream --rtsp-seconds 30
python run_backend_test.py --upload C:\path\to\video.mp4        :: needs the backend running
```

No camera? Start the built-in RTSP test camera (streams `accident_clips/accident.mp4`, needs nothing extra):
```bat
python tools\rtsp_test_server.py                                   :: rtsp://127.0.0.1:8554/stream
python tools\rtsp_test_server.py --port 8555 --user admin --password test123
```

## Main API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | status, model, classes, threshold |
| POST | `/api/cctv/test-connection` | `{rtsp_url}` or `{camera_id}` → step-by-step RTSP diagnosis |
| GET | `/api/cctv/stream` | raw MJPEG preview (legacy) |
| GET/POST/PUT/DELETE | `/api/cameras[/{id}]` | camera registry (RTSP passwords never returned) |
| POST | `/api/cameras/{id}/start` · `/stop` · `/test` | control detection for a camera |
| POST | `/api/detect/rtsp` | start live detection on a camera or ad-hoc RTSP URL |
| POST | `/api/detect/video` | upload a video and start detection |
| POST | `/api/uploads` | upload a video (camera source) |
| GET | `/api/detect/sessions[/{id}]` | live state: connecting / connected / detecting / accident / reconnecting / disconnected / error / completed |
| GET | `/api/detect/sessions/{id}/stream` | annotated live MJPEG |
| GET/PATCH | `/api/accidents[/{id}]` | saved accidents; acknowledge / resolve / notes |
| GET | `/detected_accidents/accidentN.mp4` | the saved footage (H.264, range requests) |
| GET | `/api/accident-clips` · POST `/api/detect/sample-clip` | test videos in `backend/accident_clips` |

RTSP error codes: `INVALID_URL`, `DNS_FAILED`, `CONNECTION_REFUSED`, `TIMEOUT`, `UNREACHABLE`, `NOT_RTSP`,
`AUTH_REQUIRED`, `AUTH_FAILED`, `STREAM_NOT_FOUND`, `FORBIDDEN`, `UNSUPPORTED_STREAM`, `OPEN_FAILED`,
`NO_FRAMES`, `STREAM_DISCONNECTED`. Passwords are masked (`rtsp://user:***@host`) in all responses and logs.
