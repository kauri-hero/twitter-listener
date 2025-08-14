# Brand Listener 🔍

A comprehensive TypeScript monorepo for monitoring brand mentions across Twitter/X using advanced detection methods including explicit text matching and AI-powered image recognition.

## 🚀 Features

### Core Capabilities
- **Explicit Detection**: Direct @mentions and keyword monitoring
- **Image Recognition**: AI-powered brand logo detection in images using Google Vision or CLIP
- **Smart Notifications**: Rich Slack messages with confidence scoring
- **Comprehensive Logging**: Detailed tracking in Google Sheets
- **Automated Scheduling**: Runs every 30 minutes via GitHub Actions

### Technical Architecture
- **Turborepo Monorepo**: Organized service-based architecture
- **TypeScript-First**: Full type safety across all services
- **Modular Design**: Independent services for Twitter, Vision, Pipelines, and Sinks
- **Production Ready**: Error handling, retries, rate limiting, and state management

## 📁 Project Structure

```
brand-listener/
├── packages/
│   └── core/                          # Core package with all services
│       └── src/
│           ├── services/
│           │   ├── twitter/           # TwitterAPI.io integration
│           │   ├── vision/            # Image recognition (GCP Vision + CLIP)
│           │   ├── pipelines/         # Detection logic
│           │   └── sinks/             # Slack + Google Sheets output
│           ├── config.ts              # Configuration management
│           ├── types.ts               # Shared TypeScript types
│           └── utils.ts               # Shared utilities
└── apps/
    └── brand-listener/                # Main application
        ├── src/main.ts               # Main orchestrator
        ├── config.yaml               # Configuration file
        └── .github/workflows/        # CI/CD automation
```

## ⚡ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd brand-listener
npm install
```

### 2. Configure Environment Variables

Create environment variables for:

```bash
# Required
TWITTER_API_KEY=your_twitterapi_io_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
GOOGLE_APPLICATION_CREDENTIALS_JSON=base64_encoded_service_account_json

# Optional (for Google Vision)
GOOGLE_PROJECT_ID=your_google_cloud_project_id
```

### 3. Configure Your Brand

Edit `apps/brand-listener/config.yaml`:

```yaml
brand:
  handles: ["yourbrand"]
  keywords: ["yourbrand", "your brand", "#yourbrand"]
  negative_keywords: ["job opening", "parody"]

sheet:
  spreadsheetId: "your_google_sheets_id"

notify:
  slack_channel: "#brand-monitoring"
```

### 4. Run Locally

```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm run start
```

## 🔧 Configuration

### Brand Configuration
```yaml
brand:
  handles: ["mybrand"]                 # @mentions to monitor
  keywords: ["mybrand", "product"]     # Keywords to search for
  negative_keywords: ["competitor"]    # Terms to exclude
```

### Detection Thresholds
```yaml
thresholds:
  notify: 0.80      # Send Slack notification
  log_only: 0.60    # Log to sheets only
  # Below 0.60 = ignore
```

### Image Recognition
```yaml
image:
  backend: "gcp-vision"    # or "clip-onnx"
  logoThreshold: 0.80      # Google Vision confidence
  clipThreshold: 0.32      # CLIP similarity threshold
```

## 🤖 Detection Methods

### 1. Explicit Detection
- **@Mentions**: Direct mentions of your brand handles
- **Keyword Search**: Brand names, products, hashtags
- **Confidence Scoring**: 1.0 for handles, 0.95 for exact matches, 0.8 for keywords

### 2. Image-Only Detection
- **Google Vision**: Logo detection API for brand logos
- **CLIP ONNX**: Semantic image similarity (optional)
- **Smart Filtering**: Excludes tweets already containing brand text

## 📊 Data Flow

1. **Collection**: Fetch from TwitterAPI.io (mentions + advanced search)
2. **Analysis**: Text matching + image recognition
3. **Scoring**: Confidence calculation with thresholds
4. **Decision**: Notify, log-only, or ignore based on confidence
5. **Output**: Slack notifications + Google Sheets logging

## 🔌 Services Architecture

### Twitter Service
- TwitterAPI.io client with retry logic
- Advanced search with Brigadir query grammar
- Mentions endpoint with time-based pagination
- Query builders for explicit and image-only searches

### Vision Service
- **GCP Vision Provider**: Logo detection with fuzzy matching
- **CLIP ONNX Provider**: Semantic similarity (extensible)
- Pluggable architecture for additional vision backends

### Pipeline Service
- **Explicit Pipeline**: Handles mentions and keyword searches
- **Image Pipeline**: Processes image-only tweets
- **Orchestrator**: Coordinates pipelines and deduplication

### Sinks Service
- **Slack Sink**: Rich Block Kit messages with tweet previews
- **Sheets Sink**: Comprehensive logging with metadata
- **State Management**: Watermarks to prevent duplicates

## 📈 Monitoring & Logging

### Slack Notifications
- Rich formatting with author info and tweet previews  
- Confidence badges (EXPLICIT vs IMAGE-IMPLICIT)
- Quick action buttons (Open Tweet, View Profile)
- Contextual information (matched terms, image analysis)

### Google Sheets Logging
- Complete audit trail with 18 columns of data
- Run IDs for tracking execution batches
- Error logging and debugging information
- State management for watermarks

## 🚀 Production Deployment

### GitHub Actions
Automatically runs every 30 minutes:
```yaml
schedule:
  - cron: "*/30 * * * *"
```

### Required Secrets
- `TWITTERAPI_KEY`: Your TwitterAPI.io API key
- `SLACK_WEBHOOK_URL`: Slack incoming webhook URL
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Base64-encoded service account JSON
- `GOOGLE_PROJECT_ID`: Google Cloud project ID (optional)

## 🛠️ Development

### Available Commands
```bash
# Development
npm run dev           # Run with hot reload
npm run build         # Build all packages
npm run typecheck     # Type checking
npm run lint          # Code linting

# Individual package commands
npm run build --workspace=@brand-listener/core
npm run test --workspace=@brand-listener/core
```

### Adding New Detection Methods
1. Create new provider in `packages/core/src/services/vision/providers/`
2. Implement `VisionProvider` interface
3. Add to `VisionService` factory
4. Update configuration schema

### Extending Sinks
1. Create new sink in `packages/core/src/services/sinks/`
2. Implement required interfaces
3. Add to main orchestrator
4. Update configuration

## 🔐 Security

- Environment variables for all secrets
- Base64 encoding for Google credentials  
- No secrets committed to repository
- Secure webhook URLs for Slack integration
- API key rotation support

## 📋 API Reference

### TwitterAPI.io Integration
- **Advanced Search**: `GET /twitter/tweet/advanced_search`
- **Mentions**: `GET /twitter/user/mentions`  
- **Tweet Details**: `GET /twitter/tweets`
- Full pagination support with cursor-based navigation

### Google Cloud Vision
- Logo Detection API for brand identification
- Label Detection for related terms
- Confidence scoring and fuzzy matching

## 🎯 Example Queries

### Explicit Brand Search
```
("mybrand" OR "my brand" OR "#mybrand") lang:en -is:retweet since:2024-01-01_12:00:00_UTC
```

### Image-Only Search  
```
has:images -("mybrand" OR "my brand" OR @mybrand) lang:en -is:retweet since:2024-01-01_12:00:00_UTC
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using TypeScript, TwitterAPI.io, Google Cloud Vision, and modern Node.js**
# twitter-listener
