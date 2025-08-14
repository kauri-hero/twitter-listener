import type { TwitterClient } from '../twitter/index.js';
import { buildImageOnlyQuery, toSinceUTCString, isWithinWindow } from '../twitter/index.js';
import type { VisionService } from '../vision/index.js';
import type { StateStore, Tweet, DetectionResult } from '../../types.js';
import type { ImagePipelineConfig, PipelineContext, ImageResult } from './types.js';

export class ImagePipeline {
  constructor(
    private twitterClient: TwitterClient,
    private visionService: VisionService,
    private stateStore: StateStore,
    private config: ImagePipelineConfig
  ) {}

  async run(context: PipelineContext): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    try {
      const imageResults = await this.processImageOnlyTweets(context);
      results.push(...imageResults);

      await this.updateWatermarks(results, context);

      return this.deduplicateResults(results, context);
    } catch (error) {
      console.error('Image pipeline error:', error);
      throw error;
    }
  }

  private async processImageOnlyTweets(context: PipelineContext): Promise<ImageResult[]> {
    const results: ImageResult[] = [];
    const sinceISOKey = 'sinceISO_images';
    const lastSinceISO = await this.stateStore.get(sinceISOKey);
    const sinceISO = lastSinceISO || toSinceUTCString(context.windowStart);

    const query = buildImageOnlyQuery(this.config.excludeTerms, 'en', sinceISO);
    let cursor: string | undefined;
    let pageCount = 0;
    const maxPages = 15; // Limit to control API costs

    do {
      try {
        const response = await this.twitterClient.advancedSearch({
          query,
          queryType: 'Latest',
          cursor
        });

        for (const tweet of response.tweets) {
          if (context.seenIds.has(tweet.id)) continue;
          if (!isWithinWindow(tweet.createdAt, context.windowStart)) continue;
          if (!this.hasImages(tweet)) continue;

          context.seenIds.add(tweet.id);
          
          const imageResult = await this.analyzeImageTweet(tweet, context);
          if (imageResult) {
            results.push(imageResult);
          }
        }

        cursor = response.next_cursor;
        pageCount++;
      } catch (error) {
        console.error('Error processing image search:', error);
        break;
      }
    } while (cursor && pageCount < maxPages);

    return results;
  }

  private hasImages(tweet: Tweet): boolean {
    return tweet.entities?.media?.some(media => media.type === 'photo') || 
           tweet.media?.some(media => media.type === 'photo') ||
           false;
  }

  private getImageUrls(tweet: Tweet): string[] {
    const urls: string[] = [];
    
    // Check entities.media
    if (tweet.entities?.media) {
      for (const media of tweet.entities.media) {
        if (media.type === 'photo' && media.media_url_https) {
          urls.push(media.media_url_https);
        }
      }
    }
    
    // Check direct media array
    if (tweet.media) {
      for (const media of tweet.media) {
        if (media.type === 'photo' && media.media_url_https) {
          urls.push(media.media_url_https);
        }
      }
    }
    
    return urls;
  }

  private async analyzeImageTweet(tweet: Tweet, context: PipelineContext): Promise<ImageResult | null> {
    const imageUrls = this.getImageUrls(tweet);
    if (imageUrls.length === 0) return null;

    try {
      const visionResults = await this.visionService.analyzeImages(imageUrls, this.config.brandKeywords);
      
      // Check if any image matches the brand
      const hasMatch = visionResults.some(result => result.logoMatch);
      if (!hasMatch) return null;

      // Calculate overall confidence
      const maxConfidence = Math.max(...visionResults.map(r => r.confidence));
      const threshold = this.config.logoThreshold; // Use appropriate threshold based on backend
      
      if (maxConfidence < threshold) return null;

      // Collect explanations
      const imageExplanations = visionResults
        .filter(r => r.logoMatch)
        .flatMap(r => r.explanations);

      return {
        tweet,
        reason: 'image_only',
        confidence: maxConfidence,
        image_explanations: imageExplanations,
        imageUrls,
        visionResults
      };
    } catch (error) {
      console.error(`Failed to analyze images for tweet ${tweet.id}:`, error);
      return null;
    }
  }

  private deduplicateResults(results: DetectionResult[], context: PipelineContext): DetectionResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.tweet.id)) {
        return false;
      }
      seen.add(result.tweet.id);
      return true;
    });
  }

  private async updateWatermarks(results: DetectionResult[], context: PipelineContext): Promise<void> {
    if (results.length === 0) return;

    const latestTweet = results.reduce((latest, current) => 
      new Date(current.tweet.createdAt) > new Date(latest.tweet.createdAt) ? current : latest
    );

    await this.stateStore.set(
      'sinceISO_images', 
      toSinceUTCString(new Date(latestTweet.tweet.createdAt))
    );
  }
}
