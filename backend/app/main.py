from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatResponse(BaseModel):
    reply: str

class Detection(BaseModel):
    label: str
    confidence: float
    bbox: List[int]

class ImageAnalysisResponse(BaseModel):
    severity: str
    detections: List[Detection]
    classification: str

@app.post("/analyze", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    # Just to check the upload works
    print(file.filename, file.content_type)
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Show image (this will open a window on your machine)
    image.show()
    
    # Return dummy but valid values
    return {
        "severity": "mild",
        "detections": [
            {"label": "spot", "confidence": 0.9, "bbox": [10, 20, 50, 60]}
        ],
        "classification": "acne"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(text: str = Form(...)):
    # use your text model / RAG / knowledge base
    reply = "Hey there I'm Epiderma"
    return {"reply": reply}

# detections: {
#   x: number;
#   y: number;
#   width: number;
#   height: number;
#   label: string;
# }[]