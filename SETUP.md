# Brand Listener Setup Guide

This guide walks through setting up the Brand Listener for monitoring your brand mentions on Twitter/X.

## Prerequisites

- Node.js 20+
- npm or yarn
- TwitterAPI.io account and API key
- Google Cloud project (for Vision API)
- Slack workspace (for notifications)
- Google Sheets (for logging)

## Step-by-Step Setup

### 1. TwitterAPI.io Setup

1. Go to [TwitterAPI.io](https://twitterapi.io)
2. Create an account and get your API key
3. Note: TwitterAPI.io provides Twitter data at 96% lower cost than official API

### 2. Google Cloud Setup

1. Create a Google Cloud project
2. Enable the Vision API
3. Create a service account with Vision API permissions
4. Download the service account JSON key
5. Base64 encode the JSON: `cat service-account.json | base64`

### 3. Slack Setup

1. Create a Slack app in your workspace
2. Enable Incoming Webhooks
3. Create a webhook for your target channel
4. Copy the webhook URL

### 4. Google Sheets Setup

1. Create a new Google Sheets spreadsheet
2. Share it with your service account email (from step 2)
3. Copy the spreadsheet ID from the URL

### 5. Environment Configuration

Create environment variables:

```bash
# TwitterAPI.io
export TWITTER_API_KEY="your_api_key_here"

# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Google Cloud
export GOOGLE_APPLICATION_CREDENTIALS_JSON="base64_encoded_json"
export GOOGLE_PROJECT_ID="your-project-id"
```

### 6. Brand Configuration

Edit `apps/brand-listener/config.yaml`:

```yaml
brand:
  handles: ["yourbrand"]  # Your Twitter handles
  keywords: ["your brand name", "product name", "#yourbrand"]
  negative_keywords: ["competitor", "job opening"]  # Optional exclusions

sheet:
  spreadsheetId: "1ABC123...your_sheet_id_here"

notify:
  slack_channel: "#brand-monitoring"

thresholds:
  notify: 0.80    # Confidence level for Slack notifications
  log_only: 0.60  # Confidence level for logging only
```

### 7. Test Locally

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run once
npm run start
```

### 8. Deploy to GitHub Actions

1. Add repository secrets:
   - `TWITTER_API_KEY`
   - `SLACK_WEBHOOK_URL` 
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - `GOOGLE_PROJECT_ID`

2. The workflow will run automatically every 30 minutes

## Configuration Options

### Detection Thresholds

- `notify: 0.80` - Send Slack notification (high confidence)
- `log_only: 0.60` - Log to sheets only (medium confidence)
- Below 0.60 - Ignore (low confidence)

### Image Recognition

- `gcp-vision` - Google Cloud Vision Logo Detection (recommended)
- `clip-onnx` - CLIP semantic similarity (experimental)

### State Management

- `sheet` - Store watermarks in hidden Google Sheets tab (recommended)
- `file` - Store watermarks in local JSON file (development only)

## Monitoring

### Slack Notifications

Rich messages include:
- Tweet author and follower count
- Tweet text and timestamp
- Confidence score and detection type
- Image thumbnails
- Quick action buttons

### Google Sheets Logging

Comprehensive tracking with columns:
- Run ID, timestamp, tweet details
- Author information and metrics
- Detection reason and confidence
- Matched terms or image analysis
- Decision and error logging

## Troubleshooting

### Common Issues

1. **"Invalid credentials"** - Check base64 encoding of Google credentials
2. **"Rate limited"** - TwitterAPI.io has generous limits, but wait if needed
3. **"No results"** - Check your brand keywords and handles
4. **"Slack webhook failed"** - Verify webhook URL and channel permissions

### Debug Mode

Add debug logging to `main.ts`:
```typescript
console.log('Detection results:', detectionResults.length);
console.log('High confidence hits:', notifyHits.length);
```

### Testing Queries

Test your search queries manually at TwitterAPI.io:
```
("your brand" OR "#yourbrand") lang:en -is:retweet
```

## Cost Considerations

- **TwitterAPI.io**: Very affordable compared to official Twitter API
- **Google Vision**: ~$1.50 per 1000 images analyzed
- **Slack/Sheets**: Free for basic usage
- **GitHub Actions**: 2000 minutes/month free

## Security Best Practices

- Store all secrets in environment variables
- Use base64 encoding for Google credentials
- Rotate API keys regularly
- Monitor usage and costs
- Review permissions regularly

## Getting Help

- Check the main README.md for detailed technical information
- Review the code structure in `packages/core/src/`
- Test individual components during development
- Monitor GitHub Actions logs for deployment issues

Happy monitoring! 🔍
