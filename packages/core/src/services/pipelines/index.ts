import type { TwitterClient } from '../twitter/index.js';
import type { VisionService } from '../vision/index.js';
import type { StateStore, Config, DetectionResult } from '../../types.js';
import { ExplicitPipeline } from './explicit.js';
import { ImagePipeline } from './images.js';
import type { PipelineContext } from './types.js';

export class PipelineOrchestrator {
  private explicitPipeline: ExplicitPipeline;
  private imagePipeline: ImagePipeline;

  constructor(
    twitterClient: TwitterClient,
    visionService: VisionService,
    stateStore: StateStore,
    config: Config
  ) {
    this.explicitPipeline = new ExplicitPipeline(
      twitterClient,
      stateStore,
      {
        handles: config.brand.handles,
        keywords: config.brand.keywords,
        negative_keywords: config.brand.negative_keywords,
        lang: config.filters.lang
      }
    );

    this.imagePipeline = new ImagePipeline(
      twitterClient,
      visionService,
      stateStore,
      {
        brandKeywords: config.brand.keywords,
        excludeTerms: [...config.brand.handles, ...config.brand.keywords],
        lang: config.filters.lang,
        logoThreshold: config.image.logoThreshold,
        clipThreshold: config.image.clipThreshold
      }
    );
  }

  async runPipelines(runId: string, windowMinutes: number = 35): Promise<DetectionResult[]> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const context: PipelineContext = {
      runId,
      windowStart,
      seenIds: new Set()
    };

    console.log(`Running pipelines for window: ${windowStart.toISOString()} to now`);

    try {
      // Run explicit pipeline
      console.log('Running explicit pipeline...');
      const explicitResults = await this.explicitPipeline.run(context);
      console.log(`Explicit pipeline found ${explicitResults.length} results`);

      // Run image pipeline
      console.log('Running image pipeline...');
      const imageResults = await this.imagePipeline.run(context);
      console.log(`Image pipeline found ${imageResults.length} results`);

      // Combine and deduplicate
      const allResults = [...explicitResults, ...imageResults];
      const deduplicatedResults = this.deduplicateAcrossPipelines(allResults);
      
      console.log(`Total unique results: ${deduplicatedResults.length}`);
      return deduplicatedResults;
    } catch (error) {
      console.error('Pipeline orchestrator error:', error);
      throw error;
    }
  }

  private deduplicateAcrossPipelines(results: DetectionResult[]): DetectionResult[] {
    const tweetMap = new Map<string, DetectionResult>();
    
    for (const result of results) {
      const existing = tweetMap.get(result.tweet.id);
      if (!existing || result.confidence > existing.confidence) {
        tweetMap.set(result.tweet.id, result);
      }
    }
    
    return Array.from(tweetMap.values()).sort((a, b) => 
      new Date(b.tweet.createdAt).getTime() - new Date(a.tweet.createdAt).getTime()
    );
  }
}

export { ExplicitPipeline } from './explicit.js';
export { ImagePipeline } from './images.js';
export type { PipelineContext, ExplicitResult, ImageResult } from './types.js';
