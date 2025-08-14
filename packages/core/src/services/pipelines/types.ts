import type { Tweet, DetectionResult } from '../../types.js';

export interface ExplicitPipelineConfig {
  handles: string[];
  keywords: string[];
  negative_keywords?: string[];
  lang: string;
}

export interface ImagePipelineConfig {
  brandKeywords: string[];
  excludeTerms: string[];
  lang: string;
  logoThreshold: number;
  clipThreshold: number;
}

export interface PipelineContext {
  runId: string;
  windowStart: Date;
  seenIds: Set<string>;
}

export interface ExplicitResult extends DetectionResult {
  source: 'mentions' | 'keywords';
  matchedTerms: string[];
}

export interface ImageResult extends DetectionResult {
  imageUrls: string[];
  visionResults: any[];
}
