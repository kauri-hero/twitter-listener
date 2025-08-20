import { z } from 'zod';

// Basic schemas for reusable types
export const MediaSizeSchema = z.object({
  w: z.number(),
  h: z.number(),
  resize: z.enum(['fit', 'crop'])
});

export const HashtagSchema = z.object({
  text: z.string(),
  indices: z.tuple([z.number(), z.number()])
});

export const UserMentionSchema = z.object({
  id: z.string().optional(),
  id_str: z.string().optional(),
  name: z.string(),
  screen_name: z.string(),
  indices: z.tuple([z.number(), z.number()])
})

export const UrlEntitySchema = z.object({
  url: z.string(),  
  expanded_url: z.string().optional(),
  display_url: z.string().optional(),
  indices: z.tuple([z.number(), z.number()])
})

export const MediaEntitySchema = UrlEntitySchema.extend({
  id: z.string(),
  media_url: z.string().optional(),
  media_url_https: z.string().optional(),
  type: z.enum(['photo', 'video', 'animated_gif']).optional(),
  sizes: z.object({
    thumb: MediaSizeSchema,
    small: MediaSizeSchema,
    medium: MediaSizeSchema,
    large: MediaSizeSchema
  }).optional()
})

export const TweetEntitiesSchema = z.object({
  hashtags: z.array(HashtagSchema).optional(),
  user_mentions: z.array(UserMentionSchema).optional(),
  urls: z.array(UrlEntitySchema).optional(),
  media: z.array(MediaEntitySchema).optional()
})

export const PublicMetricsSchema = z.object({
  // Support both naming conventions
  retweet_count: z.number().optional(),
  reply_count: z.number().optional(),
  like_count: z.number().optional(),
  quote_count: z.number().optional(),
  // API actual field names
  retweetCount: z.number().optional(),
  replyCount: z.number().optional(),
  likeCount: z.number().optional(),
  quoteCount: z.number().optional(),
  viewCount: z.number().optional(),
  bookmarkCount: z.number().optional()
});

export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  userName: z.string(),
  // Support multiple verification fields
  verified: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isBlueVerified: z.boolean().optional(),
  verifiedType: z.string().nullable().optional(),
  // Support both naming conventions
  followersCount: z.number().optional(),
  followingCount: z.number().optional(),
  followers: z.number().optional(),
  following: z.number().optional(),
  // Additional fields from API
  profileImageUrl: z.string().optional(),
  profilePicture: z.string().optional(),
  coverPicture: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  url: z.string().optional(),
  twitterUrl: z.string().optional()
  }) // Allow additional fields

export const TweetSchema = z.object({
  id: z.string(),
  url: z.string(),
  text: z.string(),
  createdAt: z.string(), // Accept any string format for dates
  author: AuthorSchema,
  entities: TweetEntitiesSchema.optional(),
  lang: z.string().optional(),
  // Support both naming conventions
  publicMetrics: PublicMetricsSchema.optional(),
  // Direct metric fields
  retweetCount: z.number().optional(),
  replyCount: z.number().optional(),
  likeCount: z.number().optional(),
  quoteCount: z.number().optional(),
  viewCount: z.number().optional(),
  bookmarkCount: z.number().optional(),
  // Additional API fields
  type: z.string().optional(),
  twitterUrl: z.string().optional(),
  source: z.string().optional(),
  isReply: z.boolean().optional(),
  inReplyToId: z.string().optional().nullable(),
  conversationId: z.string().optional().nullable(),
  inReplyToUserId: z.string().optional().nullable() ,
  inReplyToUsername: z.string().optional().nullable()
});

// Twitter API Parameter schemas
export const MentionsParamsSchema = z.object({
  userName: z.string(),
  sinceTime: z.number().optional(),
  untilTime: z.number().optional(),
  cursor: z.string().optional()
});

export const AdvancedSearchParamsSchema = z.object({
  query: z.string(),
  queryType: z.string().optional(),
  cursor: z.string().optional(),
  maxResults: z.number().optional()
});

export const TweetsByIdsParamsSchema = z.object({
  tweet_ids: z.array(z.string())
});

// Twitter API Response schemas
export const MentionsResponseSchema = z.object({
  mentions: z.array(TweetSchema),
  next_cursor: z.string().nullable().optional()
});

export const AdvancedSearchResponseSchema = z.object({
  tweets: z.array(TweetSchema),
  next_cursor: z.string().nullable().optional()
});

// Raw API Response schemas (for parsing external API responses)
// More permissive schema to allow any API response structure
export const RawTweetApiResponseSchema = z.object({
  tweets: z.array(TweetSchema),
  next_cursor: z.string().nullable().optional(),
  has_next_page: z.boolean().optional(),
  status: z.string().optional(),
  message: z.string().optional()
});

// Hit schema for processed tweets
export const HitSchema = z.object({
  run_id: z.string(),
  captured_at_utc: z.string(),
  tweet_id: z.string(),
  tweet_url: z.string().url(),
  author_username: z.string(),
  author_name: z.string(),
  author_followers: z.number(),
  created_at_utc: z.string(),
  text: z.string(),
  language: z.string(),
  media_urls: z.array(z.string().url()),
  reason: z.string(),
  explicit_terms: z.array(z.string()),
  image_explanations: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  decision: z.enum(['notify', 'log_only', 'ignore']),
  slack_ts: z.string().optional(),
  errors: z.array(z.string())
});

// Type inference from schemas
export type MediaSize = z.infer<typeof MediaSizeSchema>;
export type Hashtag = z.infer<typeof HashtagSchema>;
export type UserMention = z.infer<typeof UserMentionSchema>;
export type UrlEntity = z.infer<typeof UrlEntitySchema>;
export type MediaEntity = z.infer<typeof MediaEntitySchema>;
export type TweetEntities = z.infer<typeof TweetEntitiesSchema>;
export type PublicMetrics = z.infer<typeof PublicMetricsSchema>;
export type Author = z.infer<typeof AuthorSchema>;
export type Tweet = z.infer<typeof TweetSchema>;
export type MentionsParams = z.infer<typeof MentionsParamsSchema>;
export type AdvancedSearchParams = z.infer<typeof AdvancedSearchParamsSchema>;
export type TweetsByIdsParams = z.infer<typeof TweetsByIdsParamsSchema>;
export type MentionsResponse = z.infer<typeof MentionsResponseSchema>;
export type AdvancedSearchResponse = z.infer<typeof AdvancedSearchResponseSchema>;
export type Hit = z.infer<typeof HitSchema>;
