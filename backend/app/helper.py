import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.resnet50 import preprocess_input
from tensorflow.keras.models import load_model
import joblib
import os


# ----------------------------
# Load your saved models
# ----------------------------

# Load Random Forest model
rf = joblib.load("models/ml/random_forest_model.joblib")

# Load CNN feature extractor backbone
BACKBONE = load_model("models/ml/resnet50_backbone.h5")   # change filename if different

# Set image size used during training
IMG_SIZE = (224, 224)   # or your actual IMG_SIZE


def predict_rf(img_path):
    if not os.path.exists(img_path):
        print("Image not found:", img_path)
        return

    # Load & preprocess image
    img = image.load_img(img_path, target_size=IMG_SIZE)
    x = image.img_to_array(img)
    x = np.expand_dims(x, 0)
    x = preprocess_input(x)

    # Extract deep CNN features
    feat = BACKBONE.predict(x, verbose=0).ravel().reshape(1, -1)

    # Random Forest prediction
    pred = rf.predict(feat)
    proba = rf.predict_proba(feat)

    severity_map = {0: "mild", 1: "moderate", 2: "severe"}

    print("Image:", img_path)
    print("Predicted severity:", severity_map[pred[0]])
    print("Probabilities:", proba[0])
    return severity_map[pred[0]]

# # Example usage
# if __name__ == "__main__":  
#     test_image_path = "models/ml/pic1.jpg"  # replace with your test image path
#     predict_rf(test_image_path)



