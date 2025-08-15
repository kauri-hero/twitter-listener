import type { ProcessedTweet, Tweet } from '@brand-listener/types';

export class TweetProcessor {

  async process(
    mentionTweets: Tweet[], 
    keywordTweets: Tweet[],
    thresholds = { notify: 0.7, log_only: 0.6 }
  ): Promise<ProcessedTweet[]> {
    const processed: ProcessedTweet[] = [];
    
    // Process mentions - always relevant
    mentionTweets.forEach(tweet => {
      processed.push({
        tweet,
        source: 'mentions',
        shouldNotify: true,
        shouldLog: true,
        relevanceScore: 1.0 // Mentions are always 100% relevant
      });
    });
    
    // Process keywords - apply relevance scoring (placeholder for now)
    keywordTweets.forEach(tweet => {
      const relevanceScore = this.calculateRelevance(tweet);
      processed.push({
        tweet,
        source: 'keywords',
        shouldNotify: relevanceScore >= thresholds.notify,
        shouldLog: relevanceScore >= thresholds.log_only,
        relevanceScore
      });
    });
    
    return processed;
  }
  
  private calculateRelevance(tweet: Tweet): number {
    // TODO: Add GPT-4 relevance scoring here
    // For now, just return a placeholder score
    return 0.8;
  }
}
