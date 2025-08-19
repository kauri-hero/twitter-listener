# 🎯 Brand Listener

> AI-powered social media monitoring system that automatically tracks brand mentions and keywords across Twitter, delivering real-time notifications to Slack and comprehensive logging to Google Sheets.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=google-sheets&logoColor=white)](https://sheets.google.com/)
[![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://slack.com/)

## ✨ Features

- **🔍 Multi-Source Monitoring**: Track both direct mentions (`@yourhandle`) and keyword searches
- **🤖 Intelligent Filtering**: Relevance scoring to reduce noise and focus on important conversations
- **📱 Real-time Notifications**: Instant Slack alerts for high-priority mentions
- **📊 Comprehensive Logging**: Automatic data capture to Google Sheets for analysis
- **⚡ Automated Execution**: Runs on GitHub Actions every 6 hours (customizable)
- **🛡️ Production Ready**: Secure authentication, error handling, and monitoring
- **🔧 Easy Configuration**: YAML-based setup with environment-specific settings

## 🏗️ Architecture

```mermaid
graph TB
    A[GitHub Actions Trigger] --> B[Brand Listener App]
    B --> C[Twitter API Client]
    B --> D[Tweet Processor]
    D --> E{Relevance Score}
    E -->|High Score| F[Slack Notifications]
    E -->|Medium Score| G[Google Sheets Logging]
    E -->|Low Score| H[Discard]
    
    C --> I[Mentions Source]
    C --> J[Keywords Source]
    I --> D
    J --> D
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#4CAF50,color:#fff
    style G fill:#2196F3,color:#fff
    style H fill:#f44336,color:#fff
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **pnpm**
- **Twitter Developer Account** with API access
- **Google Cloud Project** with Sheets API enabled
- **Slack Workspace** with webhook permissions
- **GitHub repository** for automated execution

### 1. Clone and Install

```bash
git clone https://github.com/alavida.ai/twitter-listener.git
cd twitter-listener
pnpm install
```

### 2. Configure Authentication

See the [detailed authentication setup](#🔐-authentication-setup) below.

### 3. Configure Monitoring

```bash
# Copy the configuration template
cp apps/brand-listener/config.yaml.example apps/brand-listener/config.yaml

# Edit with your brand details
nano apps/brand-listener/config.yaml
```

### 4. Test Locally

```bash
# Set up local environment
cp .env.example .env
# Edit .env with your credentials

# Run the monitoring cycle
pnpm run dev
```

### 5. Deploy to GitHub Actions

Commit your changes and push to GitHub. The system will automatically run every 6 hours.

## 🔐 Authentication Setup

### Twitter API .io Setup

1. **Create Twitter API .io Account**
   - Go to [TwitterAPI.io](https://twitterapi.io/?ref=alexgirardet) (Referall cuz why not, you got this for free, and I wouldn't recommend BS)
   - Sign up for an account
   - Choose a plan that fits your monitoring needs

2. **Generate API Key**
   - Navigate to your dashboard
   - Copy your **API Key** (this is your `TWITTER_API_KEY`)
   - No complex OAuth setup required!

3. **Why Twitter API .io?**
   - **Simplified Setup**: No complex OAuth or Twitter Developer approval needed
   - **Reliable Access**: Consistent data access without API v2 migration issues
   - **Better Rate Limits**: More predictable and generous rate limiting
   - **Real-time Data**: Direct access to mentions and search results
   - **Cost-Effective**: More affordable than Twitter's enterprise pricing

### Google Cloud Setup

1. **Create Google Cloud Project**
   ```bash
   # Using gcloud CLI
   gcloud projects create your-brand-listener-project
   gcloud config set project your-brand-listener-project
   ```

2. **Enable Google Sheets API**
   ```bash
   gcloud services enable sheets.googleapis.com
   ```

3. **Create Service Account**
   ```bash
   # Create service account
   gcloud iam service-accounts create brand-listener-bot \
       --display-name="Brand Listener Bot" \
       --description="Service account for automated brand monitoring"

   # Grant necessary permissions
   gcloud projects add-iam-policy-binding your-brand-listener-project \
       --member="serviceAccount:brand-listener-bot@your-brand-listener-project.iam.gserviceaccount.com" \
       --role="roles/editor"
   ```

4. **Generate Service Account Credentials**
   ```bash
   # Generate credentials JSON file (this creates gcp-credentials.json locally)
   gcloud iam service-accounts keys create ./gcp-credentials.json \
       --iam-account=brand-listener-bot@your-brand-listener-project.iam.gserviceaccount.com
   
   # Verify the file was created
   ls -la gcp-credentials.json
   ```

   ⚠️ **Important**: Keep this file secure and never commit it to version control!

5. **Create Google Sheet**
   - Create a new Google Sheet for your data
   - Share it with your service account email: `brand-listener-bot@your-project.iam.gserviceaccount.com`
   - Set permission to "Editor"
   - Copy the spreadsheet ID from the URL

### Slack Setup

1. **Create Slack App**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" → "From scratch"
   - Choose your workspace

2. **Enable Incoming Webhooks**
   - Go to "Incoming Webhooks" in your app settings
   - Toggle "Activate Incoming Webhooks" to On
   - Click "Add New Webhook to Workspace"
   - Select the channel for notifications
   - Copy the webhook URL

## 🔧 Configuration

### Environment Variables

Create a `.env` file for local development:

```bash
# Twitter API .io
TWITTER_API_KEY=your_twitterapi_io_api_key_here

# Slack Integration  
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Google Cloud
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON=./gcp-credentials.json

# Environment
NODE_ENV=development
```

### Application Configuration

Edit `apps/brand-listener/config.yaml`:

```yaml
# Brand Listener Configuration
brand:
  handles: ["yourhandle", "yourbrand"]  # Twitter handles to monitor (without @)
  keywords: ["your product", "your company"]  # Keywords to search for

filters:
  lang: "en"  # Language filter for tweets
  time_range_hours: 6  # How many hours back to search

notify:
  slack_channel: "#social-monitoring"  # Slack channel for notifications

thresholds:
  notify: 0.80  # Relevance score needed for Slack notifications (0.0-1.0)
  log_only: 0.60  # Relevance score needed for logging to sheets

sheet:
  spreadsheetId: "YOUR_GOOGLE_SHEET_ID_HERE"  # Your Google Sheet ID
  sheetName: "Sheet1"  # Sheet tab name
```

### GitHub Secrets

Set up the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `TWITTER_API_KEY` | Your Twitter API .io API Key | `your-api-key-from-twitterapi-io` |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX` |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Service account JSON (minified) | `{"type":"service_account","project_id":"your-project"...}` |
| `GOOGLE_PROJECT_ID` | Your Google Cloud project ID | `your-brand-listener-project` |

**To prepare the `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret:**

After generating `gcp-credentials.json` locally (see step 4 above), you need to minify it for GitHub secrets:

**Option 1: Using jq (recommended)**
```bash
# Minify the JSON credentials using jq
cat gcp-credentials.json | jq -c .

# Or copy directly to clipboard (macOS)
cat gcp-credentials.json | jq -c . | pbcopy

# Or copy directly to clipboard (Linux)
cat gcp-credentials.json | jq -c . | xclip -selection clipboard
```

**Option 2: Using Python**
```bash
# Minify the JSON credentials using Python
python3 -c "import json; print(json.dumps(json.load(open('gcp-credentials.json'))))"
```

Copy the minified JSON output and paste it as the value for the `GOOGLE_APPLICATION_CREDENTIALS_JSON` GitHub secret.

## 💻 Local Development

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Verify setup
pnpm run verify
```

### Available Scripts

```bash
# Development
pnpm run dev              # Run brand listener once
pnpm run build            # Build all packages
pnpm run clean            # Clean build artifacts

# Utilities
pnpm run verify           # Verify environment setup
pnpm run lint             # Run linting
pnpm run typecheck        # Type checking
```

### Project Structure

```
brand-listener/
├── apps/
│   └── brand-listener/           # Main application
│       ├── src/main.ts          # Entry point
│       └── config.yaml          # Configuration
├── packages/
│   ├── core/                    # Core business logic
│   │   └── src/services/
│   │       ├── sources/         # Twitter data sources
│   │       ├── processing/      # Tweet processing
│   │       └── sinks/          # Output destinations
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Shared utilities
├── .github/workflows/           # GitHub Actions
└── scripts/                     # Utility scripts
```

## 🤖 GitHub Actions Deployment

### Workflow Configuration

The system automatically runs on GitHub Actions with the following triggers:

- **Schedule**: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **Push**: On pushes to main branch
- **Manual**: Via workflow dispatch

### Customizing the Schedule

Edit `.github/workflows/brand-listener.yml`:

```yaml
on:
schedule:
    # Run every 2 hours
    - cron: "0 */2 * * *"
    # Run daily at 9 AM UTC
    - cron: "0 9 * * *"
    # Run weekdays at 9 AM and 5 PM UTC
    - cron: "0 9,17 * * 1-5"
```

### Manual Execution

```bash
# Using GitHub CLI
gh workflow run brand-listener.yml

# Or trigger via GitHub web interface:
# Actions → Brand Listener → Run workflow
```

## 📊 Data Schema

### Google Sheets Output

The system automatically creates the following columns in your Google Sheet:

| Column | Description | Example |
|--------|-------------|---------|
| `run_id` | Unique execution identifier | `clean-1692123456789` |
| `captured_at_utc` | When the tweet was captured | `2023-08-15T14:30:00.000Z` |
| `tweet_id` | Twitter tweet ID | `1691234567890123456` |
| `tweet_url` | Direct link to tweet | `https://twitter.com/user/status/...` |
| `author_username` | Tweet author's username | `john_doe` |
| `author_name` | Tweet author's display name | `John Doe` |
| `author_followers` | Author's follower count | `1234` |
| `created_at_utc` | When the tweet was posted | `2023-08-15T14:25:00.000Z` |
| `text` | Tweet content | `Loving the new features in @yourbrand!` |
| `language` | Detected language | `en` |
| `media_urls` | Attached media URLs | `["https://pbs.twimg.com/media/..."]` |
| `reason` | Why it was captured | `mentions` or `keywords` |
| `explicit_terms` | Matching terms found | `["@yourbrand", "new features"]` |
| `confidence` | Relevance score | `0.85` |

### Slack Notification Format

```
🎯 Brand Monitoring Alert

📧 20 mentions • 🔍 11 keyword matches

Top Mentions:
• @john_doe: "Loving the new features in @yourbrand!"
• @jane_smith: "@yourbrand customer service is amazing"
• @tech_reviewer: "@yourbrand just released something big"

View full report: [Google Sheet Link]
```

## 🔧 Troubleshooting

### Common Issues

#### "Could not load the default credentials"

**Problem**: Google Cloud authentication is not set up correctly.

**Solution**:
1. Verify your service account JSON is valid
2. Check that `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret is set correctly
3. Ensure the Google Sheets API is enabled in your project

#### "The caller does not have permission"

**Problem**: Service account doesn't have access to your Google Sheet.

**Solution**:
1. Share your Google Sheet with the service account email
2. Grant "Editor" permissions
3. Verify the spreadsheet ID in your config is correct

#### "Rate limit exceeded" from Twitter API .io

**Problem**: Twitter API .io rate limits reached.

**Solution**:
1. Reduce the `time_range_hours` in your config
2. Use more specific keywords to reduce volume
3. Consider upgrading your Twitter API .io plan for higher limits

#### "GitHub Actions workflow fails"

**Problem**: Missing or incorrect secrets.

**Solution**:
1. Verify all required secrets are set in GitHub
2. Check that secret values don't have extra spaces or characters
3. Review workflow logs for specific error messages

### Debug Mode

Enable debug logging by setting the workflow input:

```bash
gh workflow run brand-listener.yml --field debug=true
```

### Testing Locally

```bash
# Test with a smaller time range
# Edit config.yaml: time_range_hours: 1

# Run once
pnpm run dev

# Check logs for any errors
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/alavida.ai/brand-listener.git
cd brand-listener

# Install dependencies
pnpm install

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
pnpm run build
pnpm run lint
pnpm run typecheck

# Submit a pull request
```

### Adding New Features

- **Sources**: Add new social media platforms in `packages/core/src/services/sources/`
- **Sinks**: Add new output destinations in `packages/core/src/services/sinks/`
- **Processing**: Enhance relevance scoring in `packages/core/src/services/processing/`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- Twitter API .io for reliable social media data access
- Google Sheets API for data storage
- Slack API for real-time notifications
- GitHub Actions for reliable automation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/alavida.ai/brand-listener/issues)
- **Discussions**: [GitHub Discussions](https://github.com/alavida.ai/brand-listener/discussions)
- **Documentation**: [Wiki](https://github.com/alavida.ai/brand-listener/wiki)

---

**Built with ❤️ for brands who care about their online presence**