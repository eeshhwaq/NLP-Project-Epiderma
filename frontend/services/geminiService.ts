import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, AcneSeverity } from "../types";

// Initialize client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Schema for structured JSON output for analysis
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    severity: {
      type: Type.STRING,
      enum: [AcneSeverity.Mild, AcneSeverity.Moderate, AcneSeverity.Severe, AcneSeverity.None],
      description: "The overall severity level of the acne detected."
    },
    detections: {
      type: Type.ARRAY,
      description: "List of specific acne lesions detected (papules, pustules, whiteheads, blackheads, cysts, nodules).",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Type of acne (e.g., 'Pustule', 'Whitehead')" },
          box_2d: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Bounding box in [ymin, xmin, ymax, xmax] format, normalized to 0-1000."
          },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-1" }
        }
      }
    },
    treatment_suggestions: {
      type: Type.STRING,
      description: "A concise markdown formatted paragraph suggesting treatments based on dermatological RAG knowledge."
    },
    disclaimer: {
      type: Type.STRING,
      description: "Medical disclaimer."
    }
  },
  required: ["severity", "detections", "treatment_suggestions", "disclaimer"]
};

export const analyzeSkinImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png", // Assuming PNG/JPEG, API handles mostly compatible types
              data: base64Image
            }
          },
          {
            text: "You are Epiderma, an expert dermatologist AI. Analyze this image for acne. Identify specific lesions (whiteheads, blackheads, papules, pustules). Determine the severity. Suggest treatments as if retrieving from a medical knowledge base (RAG). Return strictly JSON."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4, // Lower temp for more analytical precision
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from model");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing skin:", error);
    throw error;
  }
};

export const chatWithRAG = async (history: { role: string, parts: { text: string }[] }[], message: string) => {
  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: "You are Epiderma, a friendly and professional AI skincare assistant. You have access to a vast database (simulated RAG) of dermatological treatments, skincare ingredients, and routines. Provide concise, helpful advice. If the user asks about a specific image previously uploaded, refer to the context."
      }
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to my knowledge base right now. Please try again.";
  }
};