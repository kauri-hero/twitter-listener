export interface VisionProvider {
  analyzeImage(imageUrl: string, brandKeywords: string[]): Promise<VisionResult>;
}

export interface VisionResult {
  logoMatch: boolean;
  confidence: number;
  labels: string[];
  explanations: string[];
}

export interface GCPVisionResult {
  logoMatch: boolean;
  confidence: number;
  logoAnnotations: LogoAnnotation[];
  labelAnnotations: LabelAnnotation[];
}

export interface LogoAnnotation {
  description: string;
  score: number;
  boundingPoly?: BoundingPoly;
}

export interface LabelAnnotation {
  description: string;
  score: number;
  mid: string;
}

export interface BoundingPoly {
  vertices: Vertex[];
}

export interface Vertex {
  x?: number;
  y?: number;
}

export interface CLIPResult {
  similarities: number[];
  maxSimilarity: number;
  bestMatch?: string;
}
