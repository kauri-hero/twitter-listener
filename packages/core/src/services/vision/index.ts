import type { ImageConfig } from '../../types.js';
import type { VisionProvider, VisionResult } from './types.js';
import { GCPVisionProvider } from './providers/gcp-vision.js';
import { CLIPOnnxProvider } from './providers/clip-onnx.js';

export class VisionService {
  private provider: VisionProvider;

  constructor(config: ImageConfig) {
    switch (config.backend) {
      case 'gcp-vision':
        this.provider = new GCPVisionProvider();
        break;
      case 'clip-onnx':
        this.provider = new CLIPOnnxProvider();
        break;
      default:
        throw new Error(`Unknown vision backend: ${config.backend}`);
    }
  }

  async analyzeImages(imageUrls: string[], brandKeywords: string[]): Promise<VisionResult[]> {
    const results: VisionResult[] = [];
    
    for (const imageUrl of imageUrls) {
      try {
        const result = await this.provider.analyzeImage(imageUrl, brandKeywords);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze image ${imageUrl}:`, error);
        results.push({
          logoMatch: false,
          confidence: 0,
          labels: [],
          explanations: [`Failed to analyze image: ${error}`]
        });
      }
    }

    return results;
  }

  async analyzeSingleImage(imageUrl: string, brandKeywords: string[]): Promise<VisionResult> {
    return this.provider.analyzeImage(imageUrl, brandKeywords);
  }
}

export { GCPVisionProvider } from './providers/gcp-vision.js';
export { CLIPOnnxProvider } from './providers/clip-onnx.js';
export type { VisionProvider, VisionResult } from './types.js';
