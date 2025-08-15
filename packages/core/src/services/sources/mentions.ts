import type { TwitterClient } from '../twitter/client';
import type { Tweet } from '@brand-listener/types';

export interface MentionsSourceConfig {
  handles: string[];
  timeRangeHours: number;
}

export class MentionsSource {
  constructor(private client: TwitterClient) {}

  async getTweets(config: MentionsSourceConfig): Promise<Tweet[]> {
    const tweets: Tweet[] = [];
    const sinceTime = Math.floor((Date.now() - config.timeRangeHours * 60 * 60 * 1000) / 1000);
    
    for (const handle of config.handles) {
      const cleanHandle = handle.replace('@', '');
      
      try {
        const response = await this.client.mentions({
          userName: cleanHandle,
          sinceTime
        });
        
        if (response.mentions && response.mentions.length > 0) {
          tweets.push(...response.mentions);
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
