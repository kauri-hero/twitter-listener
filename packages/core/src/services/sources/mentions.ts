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
    
    console.log(`📧 Fetching mentions for ${config.handles.length} handles (rate limited to 1 request/6s)`);
    
    for (let i = 0; i < config.handles.length; i++) {
      const handle = config.handles[i];
      const cleanHandle = handle.replace('@', '');
      
      console.log(`📧 [${i + 1}/${config.handles.length}] Fetching mentions for @${cleanHandle}`);
      
      try {
        const response = await this.client.mentions({
          userName: cleanHandle,
          sinceTime
        });
        
        if (response.mentions && response.mentions.length > 0) {
          console.log(`✅ Found ${response.mentions.length} mentions for @${cleanHandle}`);
          tweets.push(...response.mentions);
        } else {
          console.log(`ℹ️ No mentions found for @${cleanHandle}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch mentions for @${cleanHandle}:`, error);
      }
    }
    
    const unique = this.removeDuplicates(tweets); 
    console.log(`📧 Total unique mentions found: ${unique.length}`);
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
