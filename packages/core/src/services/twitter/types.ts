import type { Tweet } from '../../types.js';

export interface TwitterApiResponse<T> {
  data?: T;
  errors?: TwitterApiError[];
  meta?: TwitterApiMeta;
}

export interface TwitterApiError {
  code: number;
  message: string;
}

export interface TwitterApiMeta {
  result_count?: number;
  next_token?: string;
}

export interface AdvancedSearchParams {
  query: string;
  queryType?: 'Latest' | 'Top';
  cursor?: string;
  maxResults?: number;
}

export interface MentionsParams {
  userName: string;
  sinceTime?: number;
  untilTime?: number;
  cursor?: string;
}

export interface TweetsByIdsParams {
  tweet_ids: string[];
}

export interface AdvancedSearchResponse {
  tweets: Tweet[];
  next_cursor?: string;
}

export interface MentionsResponse {
  mentions: Tweet[];
  next_cursor?: string;
}
