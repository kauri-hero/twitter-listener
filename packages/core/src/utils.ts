import type { DetectionResult, Hit, Config } from './types.js';

export function generateRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function makeDecision(confidence: number, thresholds: { notify: number; log_only: number }): 'notify' | 'log_only' | 'ignore' {
  if (confidence >= thresholds.notify) {
    return 'notify';
  } else if (confidence >= thresholds.log_only) {
    return 'log_only';
  } else {
    return 'ignore';
  }
}

export function detectionResultToHit(result: DetectionResult, runId: string, config: Config): Hit {
  const decision = makeDecision(result.confidence, config.thresholds);
  
  return {
    run_id: runId,
    captured_at_utc: new Date().toISOString(),
    tweet_id: result.tweet.id,
    tweet_url: result.tweet.url,
    author_username: result.tweet.author.userName,
    author_name: result.tweet.author.name,
    author_followers: result.tweet.author.followersCount,
    created_at_utc: result.tweet.createdAt,
    text: result.tweet.text,
    language: result.tweet.lang,
    media_urls: extractMediaUrls(result.tweet),
    reason: result.reason,
    explicit_terms: result.explicit_terms || [],
    image_explanations: result.image_explanations || [],
    confidence: result.confidence,
    decision,
    errors: []
  };
}

export function extractMediaUrls(tweet: any): string[] {
  const urls: string[] = [];
  
  // Check entities.media
  if (tweet.entities?.media) {
    for (const media of tweet.entities.media) {
      if (media.media_url_https) {
        urls.push(media.media_url_https);
      }
    }
  }
  
  // Check direct media array
  if (tweet.media) {
    for (const media of tweet.media) {
      if (media.media_url_https) {
        urls.push(media.media_url_https);
      }
    }
  }
  
  return urls;
}

export function formatSummary(
  processed: number,
  candidates: number,
  notified: number,
  errors: number
): string {
  return `Summary: ${processed} processed, ${candidates} candidates, ${notified} notified, ${errors} errors`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
