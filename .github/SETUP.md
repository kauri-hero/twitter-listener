# GitHub Actions Setup for Brand Listener

This document explains how to configure GitHub repository secrets for the automated Brand Listener workflow.

## Required Repository Secrets

Navigate to your GitHub repository → Settings → Secrets and Variables → Actions, then add these secrets:

### 1. TWITTER_API_KEY
- **Description**: Your TwitterAPI.io API key for accessing Twitter data
- **How to get**: 
  1. Sign up at [TwitterAPI.io](https://twitterapi.io)
  2. Get your API key from the dashboard
- **Example**: `abcd1234-your-twitter-api-key-here`

### 2. SLACK_WEBHOOK_URL  
- **Description**: Webhook URL for sending notifications to your Slack channel
- **How to get**:
  1. Create a Slack app in your workspace
  2. Enable Incoming Webhooks
  3. Create a webhook for your target channel
- **Example**: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX`

### 3. GOOGLE_APPLICATION_CREDENTIALS_JSON
- **Description**: Base64-encoded Google Cloud service account JSON for Google Sheets access
- **How to get**:
  1. Create a Google Cloud project
  2. Enable the Google Sheets API
  3. Create a service account with appropriate permissions
  4. Download the service account JSON key
  5. Base64 encode it: `cat service-account.json | base64 | tr -d '\n'`
- **Note**: This should be the base64-encoded content, not the file path

### 4. GOOGLE_PROJECT_ID (Optional)
- **Description**: Your Google Cloud project ID (only needed if using Google Vision API)
- **How to get**: From your Google Cloud Console dashboard
- **Example**: `my-brand-listener-project`

## Workflow Schedule

The workflow is configured to run automatically:
- **Every 6 hours**: 00:00, 06:00, 12:00, 18:00 UTC
- **Manual trigger**: You can also run it manually from the GitHub Actions tab

## Configuration

Make sure your `apps/brand-listener/config.yaml` is properly configured with:
- Brand handles to monitor
- Keywords to search for  
- Google Sheets spreadsheet ID
- Slack channel for notifications
- Detection thresholds

## Monitoring

The workflow includes:
- **Timeout**: 20 minutes max runtime
- **Failure notifications**: Automatic Slack alerts on failure
- **Log uploads**: Failure logs are uploaded as artifacts for debugging
- **Manual triggering**: Available via GitHub Actions UI

## Testing

To test the setup:
1. Add all required secrets to your repository
2. Go to Actions tab → Brand Listener workflow
3. Click "Run workflow" to trigger manually
4. Monitor the logs to ensure everything works correctly

## Troubleshooting

Common issues:
- **Missing secrets**: Check that all required secrets are configured
- **Google Sheets access**: Ensure the service account has edit access to your spreadsheet
- **Slack webhook**: Verify the webhook URL is correct and the app has posting permissions
- **Twitter API limits**: Monitor your TwitterAPI.io usage and quotas
