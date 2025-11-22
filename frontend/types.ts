export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export enum AcneSeverity {
  Mild = 'Mild',
  Moderate = 'Moderate',
  Severe = 'Severe',
  None = 'None'
}

// Normalized coordinates [ymin, xmin, ymax, xmax] (0-1000 scale or 0-1 scale, we will use 0-1000 for API consistency)
export type BoundingBox = [number, number, number, number];

export interface Detection {
  label: string;
  box_2d: BoundingBox;
  confidence: number;
}

export interface AnalysisResult {
  severity: AcneSeverity;
  detections: Detection[];
  treatment_suggestions: string;
  disclaimer: string;
}

export interface Message {
  id: string;
  sender: Sender;
  text?: string;
  image?: string; // Base64
  analysis?: AnalysisResult;
  isThinking?: boolean;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}