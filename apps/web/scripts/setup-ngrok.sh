#!/bin/bash

echo "🚀 Setting up ngrok for XGate webhooks..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    
    # For macOS with Homebrew
    if command -v brew &> /dev/null; then
        brew install ngrok/ngrok/ngrok
    # For Linux/other systems
    else
        echo "Please install ngrok manually:"
        echo "1. Go to https://ngrok.com/download"
        echo "2. Download and install for your system"
        echo "3. Run: ngrok authtoken YOUR_TOKEN (get token from ngrok.com)"
        exit 1
    fi
fi

echo "✅ ngrok is installed"

# Check if authtoken is configured
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok authtoken not configured"
    echo "Please run: ngrok authtoken YOUR_TOKEN"
    echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    exit 1
fi

echo "🌐 Starting ngrok tunnel on port 3000..."
echo "📋 Your webhook URL will be shown below:"
echo "📋 Copy the HTTPS URL and update it in XGate dashboard"
echo ""
echo "🔗 The webhook endpoint will be: https://YOUR_NGROK_URL/api/xgate/webhook"
echo ""

# Start ngrok
ngrok http 3000