#!/bin/bash

# Server-side deployment script
# Run this on the server: bash deploy.sh

set -e  # Exit on error

echo "🚀 Starting server deployment..."
echo ""

# Navigate to project directory
cd /var/www/chinese-learning-bot

# Pull latest changes from git
echo "⬇️  Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install --production

# Restart the application
echo "🔄 Restarting application with PM2..."
pm2 restart chinese-learning-bot

# Show status
echo ""
echo "📊 Application Status:"
pm2 status chinese-learning-bot

echo ""
echo "📝 Recent logs:"
pm2 logs chinese-learning-bot --lines 20 --nostream

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application running at: https://lokatsiya.online"
