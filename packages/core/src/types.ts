export interface Config {
  brand: BrandConfig;
  filters: FilterConfig;
  image: ImageConfig;
  notify: NotifyConfig;
  thresholds: ThresholdConfig;
  sheet: SheetConfig;
  state: StateConfig;
}

export interface BrandConfig {
  handles: string[];
  keywords: string[];
  negative_keywords?: string[];
}

export interface FilterConfig {
  lang: string;
  include_replies: boolean;
  include_quotes: boolean;
}

export interface ImageConfig {
  backend: "gcp-vision" | "clip-onnx";
  logoThreshold: number;
  clipThreshold: number;
}

export interface NotifyConfig {
  slack_channel: string;
}

export interface ThresholdConfig {
  notify: number;
  log_only: number;
}

export interface SheetConfig {
  spreadsheetId: string;
}

export interface StateConfig {
  storage: "sheet" | "file";
}

export interface Tweet {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  author: Author;
  entities: TweetEntities;
  viewCount?: number;
  lang?: string;
  media?: MediaEntity[];
}

export interface Author {
  id: string;
  userName: string;
  name: string;
  followersCount: number;
  verified?: boolean;
  profileImageUrl?: string;
}

export interface TweetEntities {
  hashtags: Hashtag[];
  user_mentions: UserMention[];
  urls: UrlEntity[];
  media?: MediaEntity[];
}

export interface Hashtag {
  text: string;
  indices: [number, number];
}

export interface UserMention {
  screen_name: string;
  name: string;
  id: string;
  indices: [number, number];
}

export interface UrlEntity {
  url: string;
  expanded_url: string;
  display_url: string;
  indices: [number, number];
}

export interface MediaEntity {
  id: string;
  media_url: string;
  media_url_https: string;
  url: string;
  display_url: string;
  expanded_url: string;
  type: "photo" | "video" | "animated_gif";
  indices: [number, number];
}

export interface Hit {
  run_id: string;
  captured_at_utc: string;
  tweet_id: string;
  tweet_url: string;
  author_username: string;
  author_name: string;
  author_followers: number;
  created_at_utc: string;
  text: string;
  language?: string;
  media_urls: string[];
  reason: "explicit_text" | "image_only";
  explicit_terms: string[];
  image_explanations: string[];
  confidence: number;
  decision: "notify" | "log_only" | "ignore";
  slack_ts?: string;
  errors: string[];
}

export interface DetectionResult {
  tweet: Tweet;
  reason: "explicit_text" | "image_only";
  confidence: number;
  explicit_terms?: string[];
  image_explanations?: string[];
}

export interface VisionResult {
  logoMatch: boolean;
  confidence: number;
  labels?: string[];
  explanations?: string[];
}

export interface SlackMessage {
  text: string;
  blocks: SlackBlock[];
}

export interface SlackBlock {
  type: string;
  [key: string]: any;
}

export interface StateStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  getMultiple(keys: string[]): Promise<Record<string, string | null>>;
  setMultiple(data: Record<string, string>): Promise<void>;
}

export interface TwitterSearchResponse {
  tweets: Tweet[];
  next_cursor?: string;
}

export interface TwitterMentionsResponse {
  mentions: Tweet[];
  next_cursor?: string;
}

export interface PipelineResult {
  hits: DetectionResult[];
  processed: number;
  errors: string[];
}
