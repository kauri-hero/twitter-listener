#!/bin/bash

# Brand Listener Setup Script
# This script helps you get started with Brand Listener quickly

set -e

echo "🎯 Brand Listener Setup"
echo "======================="
echo ""

# Check prerequisites
echo "📋 Checking Prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ required. Current version: $(node --version)"
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version)"

# Install dependencies
echo ""
echo "📦 Installing Dependencies..."
pnpm install

# Create configuration files
echo ""
echo "⚙️  Setting Up Configuration..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
    else
        cat > .env << EOL
# Twitter API Configuration
TWITTER_API_KEY=your_twitter_api_key_here

# Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Google Cloud Configuration
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gcp-credentials.json

# Environment
NODE_ENV=development
EOL
        echo "✅ Created .env file"
    fi
else
    echo "ℹ️  .env file already exists"
fi

# Create config.yaml if it doesn't exist
if [ ! -f "apps/brand-listener/config.yaml" ]; then
    if [ -f "apps/brand-listener/config.yaml.example" ]; then
        cp apps/brand-listener/config.yaml.example apps/brand-listener/config.yaml
        echo "✅ Created config.yaml from template"
    else
        mkdir -p apps/brand-listener
        cat > apps/brand-listener/config.yaml << EOL
# Brand Listener Configuration
brand:
  handles: ["yourbrand"]  # Replace with your Twitter handles
  keywords: ["your product"]  # Replace with your keywords

filters:
  lang: "en"
  time_range_hours: 2  # Start small for testing

notify:
  slack_channel: "#social-monitoring"

thresholds:
  notify: 0.80
  log_only: 0.60

sheet:
  spreadsheetId: "YOUR_GOOGLE_SHEET_ID_HERE"
  sheetName: "Sheet1"
EOL
        echo "✅ Created config.yaml file"
    fi
else
    echo "ℹ️  config.yaml already exists"
fi

# Build the project
echo ""
echo "🔨 Building Project..."
pnpm run build

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🔑 Set up authentication:"
echo "   • Get Twitter API key: https://developer.twitter.com/"
echo "   • Set up Google Cloud: https://console.cloud.google.com/"
echo "   • Create Slack webhook: https://api.slack.com/apps"
echo ""
echo "2. ⚙️  Configure your monitoring:"
echo "   • Edit .env with your API credentials"
echo "   • Edit apps/brand-listener/config.yaml with your brand details"
echo "   • Place gcp-credentials.json in the project root"
echo ""
echo "3. 🧪 Test locally:"
echo "   • Run: pnpm run verify"
echo "   • Run: pnpm run dev"
echo ""
echo "4. 🚀 Deploy to GitHub Actions:"
echo "   • Set up GitHub secrets"
echo "   • Push to your repository"
echo ""
echo "📖 For detailed instructions, see: README.md"
echo ""
