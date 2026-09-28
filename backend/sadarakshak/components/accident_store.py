"""Persistence for detected accidents.

Every accident produces three files in ``backend/detected_accidents``::

    accidentN.mp4   annotated accident footage (H.264)
    accidentN.jpg   annotated snapshot of the first confirmed frame
    accidentN.json  metadata (camera, time, class, confidence, status ...)

Names are reserved atomically (O_CREAT | O_EXCL), so an existing accident file
is never overwritten - even if two sessions or processes detect at once.
"""
import json
import os
import re
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from sadarakshak.constant.application import DETECTED_ACCIDENTS_DIR
from sadarakshak.logger import logging

ACCIDENT_ID_RE = re.compile(r"^accident(\d+)$")
ALLOWED_STATUSES = {"New", "Acknowledged", "Resolved"}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


class AccidentStore:
    def __init__(self, directory: Path = DETECTED_ACCIDENTS_DIR):
        self.dir = Path(directory)
        self.dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    # ------------------------------------------------------------ paths
    def clip_path(self, accident_id: str) -> Path:
        return self.dir / f"{accident_id}.mp4"

    def snapshot_path(self, accident_id: str) -> Path:
        return self.dir / f"{accident_id}.jpg"

    def meta_path(self, accident_id: str) -> Path:
        return self.dir / f"{accident_id}.json"

    @staticmethod
    def is_valid_id(accident_id: str) -> bool:
        return bool(ACCIDENT_ID_RE.match(accident_id or ""))

    # ------------------------------------------------------------ reservation
    def reserve_id(self) -> str:
        """Reserve the lowest free ``accidentN`` name by atomically creating its .mp4."""
        with self._lock:
            n = 0
            while True:
                accident_id = f"accident{n}"
                if not self.meta_path(accident_id).exists():
                    try:
                        fd = os.open(self.clip_path(accident_id), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                        os.close(fd)
                        return accident_id
                    except FileExistsError:
                        pass
                n += 1

    # ------------------------------------------------------------ read / write
    def save(self, record: Dict) -> Dict:
        accident_id = record["id"]
        path = self.meta_path(accident_id)
        tmp = path.with_suffix(".json.tmp")
        with self._lock:
            tmp.write_text(json.dumps(record, indent=2), encoding="utf-8")
            os.replace(tmp, path)
        return record

    def get(self, accident_id: str) -> Optional[Dict]:
        if not self.is_valid_id(accident_id):
            return None
        path = self.meta_path(accident_id)
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            logging.error(f"Corrupt accident metadata {path.name}: {e}")
            return None

    def list(self) -> List[Dict]:
        records = []
        for path in self.dir.glob("accident*.json"):
            if not self.is_valid_id(path.stem):
                continue
            rec = self.get(path.stem)
            if rec:
                records.append(rec)
        records.sort(key=lambda r: (r.get("timestamp", ""), int(ACCIDENT_ID_RE.match(r["id"]).group(1))),
                     reverse=True)
        return records

    def update(self, accident_id: str, status: Optional[str] = None, notes: Optional[str] = None,
               operator: Optional[str] = None) -> Optional[Dict]:
        rec = self.get(accident_id)
        if rec is None:
            return None
        if status is not None:
            if status not in ALLOWED_STATUSES:
                raise ValueError(f"Invalid status '{status}'. Allowed: {sorted(ALLOWED_STATUSES)}")
            rec["status"] = status
            now = utc_now_iso()
            if status == "Acknowledged":
                rec["acknowledgedAt"] = now
                rec["acknowledgedBy"] = operator or "Operator"
            elif status == "Resolved":
                rec["resolvedAt"] = now
                rec["resolvedBy"] = operator or "Operator"
        if notes is not None:
            rec["notes"] = notes[:5000]
        return self.save(rec)


accident_store = AccidentStore()
