import { request } from 'undici';
import type { 
  AdvancedSearchParams, 
  AdvancedSearchResponse, 
  MentionsParams, 
  MentionsResponse,
  TweetsByIdsParams 
} from './types.js';
import type { Tweet } from '../../types.js';

export class TwitterClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twitterapi.io';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    const url = new URL('/twitter/tweet/advanced_search', this.baseUrl);
    url.searchParams.set('query', params.query);
    url.searchParams.set('query_type', params.queryType || 'Latest');
    
    if (params.cursor) {
      url.searchParams.set('cursor', params.cursor);
    }
    
    if (params.maxResults) {
      url.searchParams.set('count', params.maxResults.toString());
    }

    const response = await this.makeRequest(url.toString());
    
    return {
      tweets: response.data?.tweets || [],
      next_cursor: response.data?.next_cursor
    };
  }

  async mentions(params: MentionsParams): Promise<MentionsResponse> {
    const url = new URL('/twitter/user/mentions', this.baseUrl);
    url.searchParams.set('userName', params.userName);
    
    if (params.sinceTime) {
      url.searchParams.set('sinceTime', params.sinceTime.toString());
    }
    
    if (params.untilTime) {
      url.searchParams.set('untilTime', params.untilTime.toString());
    }
    
    if (params.cursor) {
      url.searchParams.set('cursor', params.cursor);
    }

    const response = await this.makeRequest(url.toString());
    
    return {
      mentions: response.data?.mentions || [],
      next_cursor: response.data?.next_cursor
    };
  }

  async tweetsByIds(params: TweetsByIdsParams): Promise<Tweet[]> {
    const url = new URL('/twitter/tweets', this.baseUrl);
    url.searchParams.set('tweet_ids', params.tweet_ids.join(','));

    const response = await this.makeRequest(url.toString());
    return response.data?.tweets || [];
  }

  private async makeRequest(url: string): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await request(url, {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
            'Accept': 'application/json',
            'User-Agent': 'brand-listener/1.0.0'
          }
        });

        const data = await response.body.json();

        if (response.statusCode === 200) {
          return data;
        }

        if (response.statusCode === 429) {
          const retryAfter = response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter as string) * 1000 : baseDelay * attempt;
          
          if (attempt < maxRetries) {
            console.warn(`Rate limited, retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`);
            await this.sleep(delay);
            continue;
          }
        }

        if (response.statusCode >= 500 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`Server error ${response.statusCode}, retrying after ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }

        throw new Error(`Twitter API error: ${response.statusCode} - ${JSON.stringify(data)}`);
        
      } catch (error) {
        if (attempt === maxRetries) {
          throw new Error(`Failed to make Twitter API request after ${maxRetries} attempts: ${error}`);
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.warn(`Request failed, retrying after ${delay}ms (attempt ${attempt}/${maxRetries}): ${error}`);
        await this.sleep(delay);
      }
    }

    throw new Error('Unexpected error in makeRequest');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
