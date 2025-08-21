import type { TwitterClient } from '../twitter/client';
import type { Tweet } from '@brand-listener/types';

export interface KeywordsSourceConfig {
  keywords: string[];
  language: string;
  timeRangeHours: number;
}

export class KeywordsSource {
  constructor(private client: TwitterClient) {}

  async getTweets(config: KeywordsSourceConfig): Promise<Tweet[]> {
    const tweets: Tweet[] = [];
    const sinceTime = Math.floor((Date.now() - config.timeRangeHours * 60 * 60 * 1000) / 1000);
    
    console.log(`🔍 Fetching keywords for ${config.keywords.length} terms (rate limited to 1 request/6s)`);
    
    for (let i = 0; i < config.keywords.length; i++) {
      const keyword = config.keywords[i];
      
      console.log(`🔍 [${i + 1}/${config.keywords.length}] Searching for "${keyword}"`);
      
      try {
        const query = `${keyword} lang:${config.language} since:${sinceTime}`;
        const response = await this.client.advancedSearch({
          query,
          queryType: 'Latest'
        });
        
        if (response.tweets && response.tweets.length > 0) {
          console.log(`✅ Found ${response.tweets.length} tweets for "${keyword}"`);
          response.tweets.forEach((tweet, i) => {
          });
          tweets.push(...response.tweets);
        } else {
          console.log(`ℹ️ No tweets found for "${keyword}"`);
        }
      } catch (error) {
        console.error(`❌ Failed to search for "${keyword}":`, error);
      }
    }
    
    const unique = this.removeDuplicates(tweets);
    console.log(`🔍 Total unique keyword tweets found: ${unique.length}`);
    return unique;
  }
  
  private removeDuplicates(tweets: Tweet[]): Tweet[] {
    const seen = new Set<string>();
    return tweets.filter(tweet => {
      if (seen.has(tweet.id)) return false;
      seen.add(tweet.id);
      return true;
    });
  }
}
