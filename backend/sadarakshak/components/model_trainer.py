from ultralytics import YOLO
import numpy as np
import threading
import logging
import torch

from sadarakshak.constant.application import MODEL_PATH, INFERENCE_IMGSZ, DISPLAY_CONFIDENCE


class ModelTrainer:
    """Loads the trained YOLO11 accident model (model/best.pt) and runs inference.

    One instance is shared by every detection session; ``detect_objects`` is
    serialised with a lock because the Ultralytics predictor is not thread-safe.
    """

    def __init__(self, model_path=MODEL_PATH):
        logging.info(f"Loading YOLO model from {model_path}")
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logging.info(f"Using device: {self.device}")
        self.model = YOLO(str(model_path))
        self.model.to(self.device)
        self.class_names = {int(k): v for k, v in self.model.names.items()}
        self._lock = threading.Lock()
        logging.info(f"Model loaded successfully ({len(self.class_names)} classes: {self.class_names})")

    def detect_objects(self, frame, conf=DISPLAY_CONFIDENCE):
        """Run YOLO on a BGR frame.

        Returns ``(boxes, class_ids, confidences)`` as numpy arrays, with boxes
        in ``xyxy`` pixel coordinates of the *input* frame. Ultralytics handles
        letterboxing to the training size (640) and maps boxes back.
        """
        with self._lock:
            results = self.model.predict(
                frame,
                imgsz=INFERENCE_IMGSZ,
                conf=conf,
                device=self.device,
                verbose=False,
            )[0]
        boxes = results.boxes.xyxy.cpu().numpy()
        class_ids = results.boxes.cls.cpu().numpy().astype(np.int32)
        confidences = results.boxes.conf.cpu().numpy()
        return boxes, class_ids, confidences
