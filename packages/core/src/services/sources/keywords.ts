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
    
    for (const keyword of config.keywords) {
      try {
        const query = `${keyword} lang:${config.language} since:${sinceTime}`;
        const response = await this.client.advancedSearch({
          query,
          queryType: 'Latest'
        });
        
        if (response.tweets && response.tweets.length > 0) {
          response.tweets.forEach((tweet, i) => {
          });
          tweets.push(...response.tweets);
        } else {
        }
      } catch (error) {
      }
    }
    
    const unique = this.removeDuplicates(tweets);
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
