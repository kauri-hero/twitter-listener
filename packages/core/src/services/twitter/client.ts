
import type { 
  Tweet, 
  MentionsParams, 
  MentionsResponse, 
  AdvancedSearchParams, 
  AdvancedSearchResponse, 
} from '@brand-listener/types';

import {
MentionsParamsSchema,
AdvancedSearchParamsSchema,
RawTweetApiResponseSchema
} from '@brand-listener/types';

export class TwitterClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.twitterapi.io';
  private lastRequestTime = 0;
  private readonly rateLimitDelay = 6000; // 6 seconds in milliseconds

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delayNeeded = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${delayNeeded}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(url: string): Promise<unknown> {
    // Enforce rate limiting before making the request
    await this.enforceRateLimit();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error:', JSON.stringify(data, null, 2));
      throw new Error(`HTTP error! status: ${response.status}, data: ${JSON.stringify(data)}`);
    }

    return data;
  }
  async mentions(params: MentionsParams): Promise<MentionsResponse> {
    try {
    // Validate input parameters
    const validatedParams = MentionsParamsSchema.parse(params);
    
    const url = new URL('/twitter/user/mentions', this.baseUrl);
    url.searchParams.set('userName', validatedParams.userName);
    
    if (validatedParams.sinceTime) {
      url.searchParams.set('sinceTime', validatedParams.sinceTime.toString());
    }
    
    if (validatedParams.untilTime) {
      url.searchParams.set('untilTime', validatedParams.untilTime.toString());
    }
    
    if (validatedParams.cursor) {
      url.searchParams.set('cursor', validatedParams.cursor);
    }

    const rawData = await this.makeRequest(url.toString());

    const apiResponse = RawTweetApiResponseSchema.parse(rawData);
    
    const next_cursor = apiResponse.next_cursor || undefined; // Convert null to undefined
    const mentions = apiResponse.tweets;

    return {
      mentions,
      next_cursor
    };
    } catch (error) {
      console.error('❌ Error in mentions:', error);
      throw error;
    }
  }

  async advancedSearch(params: AdvancedSearchParams): Promise<AdvancedSearchResponse> {
    try {
    // Validate input parameters
    const validatedParams = AdvancedSearchParamsSchema.parse(params);
    
    const url = new URL('/twitter/tweet/advanced_search', this.baseUrl);
    url.searchParams.set('query', validatedParams.query);
    url.searchParams.set('query_type', validatedParams.queryType || 'Latest');
    
    if (validatedParams.cursor) {
      url.searchParams.set('cursor', validatedParams.cursor);
    }
    
    if (validatedParams.maxResults) {
      url.searchParams.set('count', validatedParams.maxResults.toString());
    }

    const rawData = await this.makeRequest(url.toString());

    const apiResponse = RawTweetApiResponseSchema.parse(rawData);
    
    const tweets = apiResponse.tweets;
    const next_cursor = apiResponse.next_cursor || undefined; // Convert null to undefined
    
    
    return {
      tweets,
      next_cursor
    };
    } catch (error) {
      console.error('❌ Error in advancedSearch:', error);
      throw error;
    }
  }
}