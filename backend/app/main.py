# 

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from PIL import Image
import io
import numpy as np
import joblib
from ultralytics import YOLO
from helper import predict_rf
import os
import uuid
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Load all 3 models at startup
# -----------------------------

yolo_model = YOLO("models/deep/acne_detection_model.pt")
log_reg_model = joblib.load("models/ml/logistic_regression_model.joblib")
rf_model = joblib.load("models/ml/random_forest_model.joblib")


# -----------------------------
# Response Models for FastAPI
# -----------------------------
class ChatResponse(BaseModel):
    reply: str

class Detection(BaseModel):
    label: str
    confidence: float
    bbox: List[int]  # [x, y, width, height]

class ImageAnalysisResponse(BaseModel):
    severity: str
    detections: List[Detection]
    classification: str


# -----------------------------
# IMAGE ANALYSIS ENDPOINT
# -----------------------------
@app.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):

    temp_filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
    temp_filepath = os.path.join("temp_uploads", temp_filename)

    os.makedirs("temp_uploads", exist_ok=True)

    contents = await file.read()

    with open(temp_filepath, "wb") as f:
        f.write(contents)
  
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    np_img = np.array(image)

    img_h, img_w = np_img.shape[:2]

     # YOLO inference
    yolo_results = yolo_model.predict(np_img, conf=0.25)[0]
    detection_results = []

    # Process YOLO detections
    for box in yolo_results.boxes:

        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())

        # Normalize 0–1000
        ymin_norm = int((y1 / img_h) * 1000)
        xmin_norm = int((x1 / img_w) * 1000)
        ymax_norm = int((y2 / img_h) * 1000)
        xmax_norm = int((x2 / img_w) * 1000)


        class_id = int(box.cls.cpu().numpy())
        class_name = yolo_model.names[class_id]

        detection_results.append({
            "label": class_name,
            "confidence": float(box.conf.cpu().numpy()),
            "bbox": [xmin_norm, ymin_norm, xmax_norm, ymax_norm]
        })

    overall_severity = predict_rf(temp_filepath)
    os.remove(temp_filepath)

    # -------------------------------------
    # Return final response
    # -------------------------------------
    return {
        "severity": str(overall_severity),
        "detections": detection_results,
        "classification": "multi"
    }


# -----------------------------
# SIMPLE CHAT ENDPOINT

# -----------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(text: str = Form(...)):
    reply = "Hey there I'm Epiderma"
    return {"reply": reply}
