import {
  loadConfig,
  validateEnvVars,
  getEnvVar,
  TwitterClient,
  VisionService,
  PipelineOrchestrator,
  SlackSink,
  SheetsSink,
  createStateStore,
  generateRunId,
  detectionResultToHit,
  formatSummary
} from '@brand-listener/core';
import type { Config, Hit, DetectionResult } from '@brand-listener/core';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function main(): Promise<void> {
  console.log('🚀 Brand Listener starting up...');
  
  try {
    // Validate environment variables
    console.log('🔧 Validating environment variables...');
    validateEnvVars();
    
    // Load configuration
    console.log('📋 Loading configuration...');
    const config = await loadConfig('config.yaml');
    console.log(`✅ Configuration loaded for brand: ${config.brand.handles.join(', ')}`);
    
    // Initialize services
    console.log('🔌 Initializing services...');
    const twitterClient = new TwitterClient(getEnvVar('TWITTER_API_KEY'));
    const visionService = new VisionService(config.image);
    const stateStore = createStateStore(config.state, config.sheet.spreadsheetId);
    
    // Initialize pipelines
    const orchestrator = new PipelineOrchestrator(
      twitterClient,
      visionService,
      stateStore,
      config
    );
    
    // Initialize sinks
    const slackSink = new SlackSink({
      webhook_url: getEnvVar('SLACK_WEBHOOK_URL'),
      channel: config.notify.slack_channel
    });
    
    const sheetsSink = new SheetsSink({
      spreadsheet_id: config.sheet.spreadsheetId
    });
    
    // Generate run ID
    const runId = generateRunId();
    console.log(`🎯 Starting run: ${runId}`);
    
    // Run pipelines
    console.log('🔍 Running detection pipelines...');
    const detectionResults = await orchestrator.runPipelines(runId);
    
    if (detectionResults.length === 0) {
      console.log('✅ No brand mentions detected');
      return;
    }
    
    // Convert to hits and categorize
    const hits: Hit[] = detectionResults.map(result => 
      detectionResultToHit(result, runId, config)
    );
    
    const notifyHits = hits.filter(hit => hit.decision === 'notify');
    const logOnlyHits = hits.filter(hit => hit.decision === 'log_only');
    const ignoredHits = hits.filter(hit => hit.decision === 'ignore');
    
    console.log(`📊 Results: ${hits.length} total, ${notifyHits.length} notify, ${logOnlyHits.length} log-only, ${ignoredHits.length} ignored`);
    
    // Send notifications for high-confidence hits
    if (notifyHits.length > 0) {
      console.log('📢 Sending Slack notifications...');
      const slackResults = await slackSink.sendHits(notifyHits);
      
      // Update hits with Slack timestamps
      for (let i = 0; i < notifyHits.length; i++) {
        const result = slackResults[i];
        if (result.success && result.metadata?.slack_ts) {
          notifyHits[i].slack_ts = result.metadata.slack_ts;
        }
        if (!result.success && result.error) {
          notifyHits[i].errors.push(result.error);
        }
      }
      
      const successfulNotifications = slackResults.filter(r => r.success).length;
      console.log(`✅ Sent ${successfulNotifications}/${notifyHits.length} Slack notifications`);
    }
    
    // Log all hits to Google Sheets
    const allLoggableHits = [...notifyHits, ...logOnlyHits];
    if (allLoggableHits.length > 0) {
      console.log('📝 Logging to Google Sheets...');
      const sheetsResult = await sheetsSink.appendHits(allLoggableHits);
      
      if (sheetsResult.success) {
        console.log(`✅ Logged ${allLoggableHits.length} hits to Google Sheets`);
      } else {
        console.error(`❌ Failed to log to Google Sheets: ${sheetsResult.error}`);
      }
    }
    
    // Print summary
    const errors = hits.reduce((acc, hit) => acc + hit.errors.length, 0);
    console.log('📈', formatSummary(hits.length, detectionResults.length, notifyHits.length, errors));
    
  } catch (error) {
    console.error('💥 Brand Listener failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});
