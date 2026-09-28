"""Browser-playable MP4 writer.

Browsers only play H.264 MP4. OpenCV's default ``mp4v`` (MPEG-4 Part 2) is
NOT playable in <video>, so clips are encoded with PyAV/libx264 (PyAV ships
with ``supervision``). Falls back to OpenCV ``avc1`` and finally ``mp4v``.
"""
from pathlib import Path
from fractions import Fraction

import cv2
import numpy as np

from sadarakshak.logger import logging

try:
    import av  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    av = None


class VideoClipWriter:
    def __init__(self, path, fps: float, width: int, height: int):
        self.path = Path(path)
        self.fps = max(1.0, min(float(fps or 25.0), 60.0))
        # yuv420p requires even dimensions
        self.width = int(width) - (int(width) % 2)
        self.height = int(height) - (int(height) % 2)
        self.frames_written = 0
        self.backend = None
        self._container = None
        self._stream = None
        self._cv_writer = None
        self._open()

    def _open(self):
        if av is not None:
            try:
                self._container = av.open(str(self.path), mode="w", options={"movflags": "+faststart"})
                rate = Fraction(self.fps).limit_denominator(1001)
                self._stream = self._container.add_stream("libx264", rate=rate)
                self._stream.width = self.width
                self._stream.height = self.height
                self._stream.pix_fmt = "yuv420p"
                self._stream.options = {"preset": "veryfast", "crf": "23"}
                self.backend = "pyav-libx264"
                return
            except Exception as e:
                logging.warning(f"PyAV H.264 writer unavailable ({e}); falling back to OpenCV")
                self._close_av()
        for fourcc in ("avc1", "mp4v"):
            writer = cv2.VideoWriter(str(self.path), cv2.VideoWriter_fourcc(*fourcc), self.fps,
                                     (self.width, self.height))
            if writer.isOpened():
                self._cv_writer = writer
                self.backend = f"opencv-{fourcc}"
                if fourcc == "mp4v":
                    logging.warning("Writing mp4v clips: these may not play in a web browser")
                return
        raise RuntimeError(f"Could not open a video writer for {self.path}")

    def write(self, frame: np.ndarray):
        if frame.shape[1] != self.width or frame.shape[0] != self.height:
            frame = cv2.resize(frame, (self.width, self.height))
        if self._stream is not None:
            vf = av.VideoFrame.from_ndarray(np.ascontiguousarray(frame), format="bgr24")
            for packet in self._stream.encode(vf):
                self._container.mux(packet)
        elif self._cv_writer is not None:
            self._cv_writer.write(frame)
        self.frames_written += 1

    def _close_av(self):
        try:
            if self._container is not None:
                self._container.close()
        except Exception:
            pass
        self._container = None
        self._stream = None

    def close(self):
        if self._stream is not None:
            try:
                for packet in self._stream.encode():
                    self._container.mux(packet)
            except Exception as e:
                logging.error(f"Error flushing encoder for {self.path.name}: {e}")
            self._close_av()
        if self._cv_writer is not None:
            self._cv_writer.release()
            self._cv_writer = None

    @property
    def duration_seconds(self) -> float:
        return round(self.frames_written / self.fps, 2)
