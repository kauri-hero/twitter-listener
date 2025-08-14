import type { TwitterClient, AdvancedSearchResponse, MentionsResponse } from '../twitter/index.js';
import { buildExplicitQuery, toSinceUTCString, isWithinWindow } from '../twitter/index.js';
import type { StateStore, Tweet, DetectionResult } from '../../types.js';
import type { ExplicitPipelineConfig, PipelineContext, ExplicitResult } from './types.js';

export class ExplicitPipeline {
  constructor(
    private twitterClient: TwitterClient,
    private stateStore: StateStore,
    private config: ExplicitPipelineConfig
  ) {}

  async run(context: PipelineContext): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    try {
      // Get mentions for each handle
      const mentionResults = await this.processMentions(context);
      results.push(...mentionResults);

      // Get keyword matches
      const keywordResults = await this.processKeywords(context);
      results.push(...keywordResults);

      // Update watermarks
      await this.updateWatermarks(results, context);

      return this.deduplicateResults(results, context);
    } catch (error) {
      console.error('Explicit pipeline error:', error);
      throw error;
    }
  }

  private async processMentions(context: PipelineContext): Promise<ExplicitResult[]> {
    const results: ExplicitResult[] = [];
    const sinceTimeKey = 'sinceTime_explicit_mentions';
    const lastSinceTime = await this.stateStore.get(sinceTimeKey);
    const sinceTime = lastSinceTime ? parseInt(lastSinceTime) : Math.floor(context.windowStart.getTime() / 1000);

    for (const handle of this.config.handles) {
      let cursor: string | undefined;
      let pageCount = 0;
      const maxPages = 10; // Prevent runaway pagination

      do {
        try {
          const response: MentionsResponse = await this.twitterClient.mentions({
            userName: handle.replace('@', ''),
            sinceTime,
            cursor
          });

          for (const tweet of response.mentions) {
            if (context.seenIds.has(tweet.id)) continue;
            if (!isWithinWindow(tweet.createdAt, context.windowStart)) continue;

            context.seenIds.add(tweet.id);
            
            const result = this.createExplicitResult(tweet, 'mentions', [`@${handle}`], context);
            results.push(result);
          }

          cursor = response.next_cursor;
          pageCount++;
        } catch (error) {
          console.error(`Error processing mentions for ${handle}:`, error);
          break;
        }
      } while (cursor && pageCount < maxPages);
    }

    return results;
  }

  private async processKeywords(context: PipelineContext): Promise<ExplicitResult[]> {
    const results: ExplicitResult[] = [];
    const sinceISOKey = 'sinceISO_explicit_keywords';
    const lastSinceISO = await this.stateStore.get(sinceISOKey);
    const sinceISO = lastSinceISO || toSinceUTCString(context.windowStart);

    const query = buildExplicitQuery(this.config.keywords, this.config.lang, sinceISO);
    let cursor: string | undefined;
    let pageCount = 0;
    const maxPages = 20;

    do {
      try {
        const response: AdvancedSearchResponse = await this.twitterClient.advancedSearch({
          query,
          queryType: 'Latest',
          cursor
        });

        for (const tweet of response.tweets) {
          if (context.seenIds.has(tweet.id)) continue;
          if (!isWithinWindow(tweet.createdAt, context.windowStart)) continue;

          // Filter out negative keywords
          if (this.containsNegativeKeywords(tweet.text)) continue;

          context.seenIds.add(tweet.id);
          
          const matchedTerms = this.findMatchedKeywords(tweet.text);
          const result = this.createExplicitResult(tweet, 'keywords', matchedTerms, context);
          results.push(result);
        }

        cursor = response.next_cursor;
        pageCount++;
      } catch (error) {
        console.error('Error processing keyword search:', error);
        break;
      }
    } while (cursor && pageCount < maxPages);

    return results;
  }

  private containsNegativeKeywords(text: string): boolean {
    if (!this.config.negative_keywords?.length) return false;
    
    const lowerText = text.toLowerCase();
    return this.config.negative_keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
  }

  private findMatchedKeywords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const matched: string[] = [];
    
    for (const keyword of this.config.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }
    
    return matched;
  }

  private createExplicitResult(
    tweet: Tweet, 
    source: 'mentions' | 'keywords', 
    matchedTerms: string[], 
    context: PipelineContext
  ): ExplicitResult {
    const confidence = this.calculateTextConfidence(matchedTerms, tweet.text);
    
    return {
      tweet,
      reason: 'explicit_text',
      confidence,
      explicit_terms: matchedTerms,
      source,
      matchedTerms
    };
  }

  private calculateTextConfidence(matchedTerms: string[], text: string): number {
    let maxConfidence = 0;
    
    for (const term of matchedTerms) {
      let confidence = 0.7; // Base confidence
      
      if (term.startsWith('@')) {
        confidence = 1.0; // Handle mentions
      } else if (term.startsWith('#')) {
        confidence = 0.95; // Hashtags
      } else if (this.isExactMatch(term, text)) {
        confidence = 0.95; // Exact brand name
      } else {
        confidence = 0.8; // Keyword match
      }
      
      maxConfidence = Math.max(maxConfidence, confidence);
    }
    
    return maxConfidence;
  }

  private isExactMatch(term: string, text: string): boolean {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(text);
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

    const updates: Record<string, string> = {
      'sinceTime_explicit_mentions': Math.floor(new Date(latestTweet.tweet.createdAt).getTime() / 1000).toString(),
      'sinceISO_explicit_keywords': toSinceUTCString(new Date(latestTweet.tweet.createdAt))
    };

    await this.stateStore.setMultiple(updates);
  }
}
