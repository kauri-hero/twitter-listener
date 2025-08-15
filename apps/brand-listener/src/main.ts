import type { Config, Tweet } from '@brand-listener/types';
import { config } from 'dotenv';
import { loadConfig, validateEnvVars, getEnvVar, Logger } from '@brand-listener/utils';
import { TwitterClient } from '@brand-listener/core/twitter';
import { MentionsSource } from '@brand-listener/core/sources';
import { KeywordsSource } from '@brand-listener/core/sources';
import { TweetProcessor } from '@brand-listener/core/processing';
import { SlackSink } from '@brand-listener/core/sinks';
import { SheetsSink } from '@brand-listener/core/sinks/sheets';

// Load .env file only when not in GitHub Actions
if (process.env.NODE_ENV !== 'production') {
  config({ path: '../../.env' });
}



const logger = new Logger({ prefix: 'BrandListener' });

async function main(): Promise<void> {
  logger.banner('Brand Listener', 'AI-Powered Social Media Monitoring');
  
  try {
    // 1. Setup
    logger.step('1️⃣', 'Setup & Configuration');
    validateEnvVars();
    const appConfig = await loadConfig('config.yaml');
    logger.success('Configuration loaded', {
      handles: appConfig.brand.handles,
      keywords: appConfig.brand.keywords,
      timeRange: `${appConfig.filters.time_range_hours}h`,
      thresholds: appConfig.thresholds
    });
    
    // 2. Initialize services
    logger.step('2️⃣', 'Initialize Services');
    const twitterClient = new TwitterClient(getEnvVar('TWITTER_API_KEY'));
    const mentionsSource = new MentionsSource(twitterClient);
    const keywordsSource = new KeywordsSource(twitterClient);
    const processor = new TweetProcessor();
    logger.success('Services initialized');
    
    // 3. Collect from sources
    logger.step('3️⃣', 'Collect Tweets from Sources');
    
    const [mentionTweets, keywordTweets] = await Promise.all([
      mentionsSource.getTweets({
        handles: appConfig.brand.handles,
        timeRangeHours: appConfig.filters.time_range_hours || 2
      }),
      keywordsSource.getTweets({
        keywords: appConfig.brand.keywords,
        language: appConfig.filters.lang,
        timeRangeHours: appConfig.filters.time_range_hours || 2
      })
    ]);
    
    logger.info('Tweet collection complete', {
      mentions: mentionTweets.length,
      keywords: keywordTweets.length,
      total: mentionTweets.length + keywordTweets.length
    });
    
    if (mentionTweets.length > 0) {
      logger.substep('📧 Mentions found', `${mentionTweets.length} tweets`);
      const preview = mentionTweets.slice(0, 3).map((tweet, i) => ({
        '#': i + 1,
        'Author': `@${tweet.author.userName}`,
        'Text': `"${tweet.text.substring(0, 60)}..."`
      }));
      logger.table(preview, ['#', 'Author', 'Text']);
      if (mentionTweets.length > 3) {
        logger.substep('', `... and ${mentionTweets.length - 3} more mentions`);
      }
    }
    
    if (keywordTweets.length > 0) {
      logger.substep('🔍 Keywords found', `${keywordTweets.length} tweets`);
      const preview = keywordTweets.slice(0, 3).map((tweet, i) => ({
        '#': i + 1,
        'Author': `@${tweet.author.userName}`,
        'Text': `"${tweet.text.substring(0, 60)}..."`
      }));
      logger.table(preview, ['#', 'Author', 'Text']);
      if (keywordTweets.length > 3) {
        logger.substep('', `... and ${keywordTweets.length - 3} more keywords`);
      }
    }
    
    if (mentionTweets.length === 0 && keywordTweets.length === 0) {
      logger.info('No tweets found in the specified time range');
      logger.success('Execution complete - no tweets to process');
      return;
    }
    
    // 4. Process tweets
    logger.step('4️⃣', 'Process & Score Tweets');
    logger.substep('Applying thresholds', `Notify: ${appConfig.thresholds.notify} | Log: ${appConfig.thresholds.log_only}`);
    const processedTweets = await processor.process(mentionTweets, keywordTweets, appConfig.thresholds);
    
    // 5. Send to sinks
    logger.step('5️⃣', 'Send to Destinations');
    await sendToSinks(processedTweets, appConfig);
    
    logger.success('Brand listening cycle complete!');
    
  } catch (error) {
    logger.error('Fatal error occurred', error);
    process.exit(1);
  }
}

async function sendToSinks(processedTweets: any[], config: Config): Promise<void> {
  const notifyTweets = processedTweets.filter(t => t.shouldNotify);
  const logTweets = processedTweets.filter(t => t.shouldLog);
  
  logger.substep('Processing results', `${notifyTweets.length} for Slack, ${logTweets.length} for Sheets`);
  
  if (processedTweets.length > 0) {
    const results = processedTweets.map((t, i) => ({
      '#': i + 1,
      'Source': t.source,
      'Author': `@${t.tweet.author.userName}`,
      'Preview': `"${t.tweet.text.substring(0, 40)}..."`,
      'Score': t.relevanceScore?.toFixed(2) || 'N/A',
      'Notify': t.shouldNotify ? '📢' : '❌',
      'Log': t.shouldLog ? '📝' : '❌'
    }));
    logger.table(results, ['#', 'Source', 'Author', 'Preview', 'Score', 'Notify', 'Log']);
  }
  
  // Send to Slack
  if (notifyTweets.length > 0) {
    try {
      logger.substep('📢 Sending to Slack', `${notifyTweets.length} notifications`);
      const slackSink = new SlackSink({
        webhook_url: getEnvVar('SLACK_WEBHOOK_URL'),
        channel: config.notify.slack_channel
      });
      
      const hits = notifyTweets.map(t => tweetToHit(t.tweet, t.source, config));
      const results = await slackSink.sendHits(hits);
      const batchResult = results[0]; // Single batched result
      
      if (batchResult?.success) {
        logger.success(`Slack batch notification sent`, `${notifyTweets.length} tweets in 1 message`);
      } else {
        logger.error(`Slack batch failed`, batchResult?.error || 'Unknown error');
      }
    } catch (error) {
      logger.error('Slack delivery failed', error);
    }
  } else {
    logger.substep('📢 Slack', 'No tweets meet notification threshold');
  }
  
  // Send to Sheets
  if (logTweets.length > 0) {
    try {
      logger.substep('📝 Logging to Sheets', `${logTweets.length} entries`);
      const sheetsSink = new SheetsSink({
        spreadsheetId: config.sheet.spreadsheetId,
        sheetName: config.sheet.sheetName
      });
      
      const hits = logTweets.map(t => tweetToHit(t.tweet, t.source, config));
      const result = await sheetsSink.appendHits(hits);
      
      if (result.success) {
        logger.success('Sheets logging complete', `${logTweets.length} entries added`);
      } else {
        logger.error('Sheets logging failed', result.error);
      }
    } catch (error) {
      logger.error('Sheets delivery failed', error);
    }
  } else {
    logger.substep('📝 Sheets', 'No tweets meet logging threshold');
  }
  
  // Final summary
  logger.summary({
    'Total Processed': processedTweets.length,
    'Slack Summary': notifyTweets.length > 0 ? '1 batched message' : 'None sent',
    'Sheet Logs': logTweets.length,
    'Mentions': processedTweets.filter(t => t.source === 'mentions').length,
    'Keywords': processedTweets.filter(t => t.source === 'keywords').length
  });
}

function tweetToHit(tweet: Tweet, source: string, config: Config): any {
  // Extract actual terms that caused the hit from config
  const explicitTerms = getExplicitTermsFromConfig(tweet, source, config);
  
  return {
    run_id: 'clean-' + Date.now(),
    captured_at_utc: new Date().toISOString(),
    tweet_id: tweet.id,
    tweet_url: tweet.url,
    author_username: tweet.author.userName,
    author_name: tweet.author.name,
    author_followers: tweet.author.followersCount || 0,
    created_at_utc: tweet.createdAt,
    text: tweet.text,
    language: tweet.lang || 'en',
    media_urls: tweet.entities?.media?.map((m: any) => m.media_url_https || m.url) || [],
    reason: source,
    explicit_terms: explicitTerms,
    image_explanations: [],
    confidence: 0.8, // More realistic confidence score
    decision: 'notify',
    slack_ts: '',
    errors: []
  };
}

function getExplicitTermsFromConfig(tweet: Tweet, source: string, config: Config): string[] {
  const tweetText = tweet.text.toLowerCase();
  
  if (source === 'mentions') {
    // For mentions, find which configured handles are actually mentioned
    const mentionedHandles = config.brand.handles.filter(handle => {
      const handlePattern = new RegExp(`@${handle.toLowerCase()}\\b`, 'i');
      return handlePattern.test(tweetText);
    });
    return mentionedHandles.map(handle => `@${handle}`);
  } 
  
  if (source === 'keywords') {
    // For keywords, find which configured keywords are actually present
    const foundKeywords = config.brand.keywords.filter(keyword => {
      const keywordLower = keyword.toLowerCase();
      return tweetText.includes(keywordLower);
    });
    return foundKeywords;
  }
  
  return []; // Fallback for unknown source
}

main().catch((error) => {
  logger.error('💥 Unhandled error in main process', error);
  process.exit(1);
});
