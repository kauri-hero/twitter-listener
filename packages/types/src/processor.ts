import type { Tweet } from "./twitter";

export interface ProcessedTweet {
    tweet: Tweet;
    source: 'mentions' | 'keywords';
    shouldNotify: boolean;
    shouldLog: boolean;
    relevanceScore?: number;
  }
  
  export interface ProcessorConfig {
    // Add GPT-4 relevance scoring config here later
    enableRelevanceScoring?: boolean;
  }