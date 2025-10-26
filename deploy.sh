#!/bin/bash

# Deployment script for DigitalOcean droplet
# Run this on your droplet: bash deploy.sh

echo "🚀 Starting deployment..."

# Stop existing PM2 processes
pm2 delete chinese-learning-bot 2>/dev/null || true

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create logs directory
mkdir -p logs

# Test if bot.js works
echo "🧪 Testing bot..."
timeout 5 node bot.js &
sleep 3
if curl -s http://localhost:3000/api/vocabulary > /dev/null; then
    echo "✅ Bot is working!"
else
    echo "❌ Bot failed to start. Check the output above."
    exit 1
fi

# Kill test process
pkill -f "node bot.js"

# Start with PM2
echo "🔄 Starting with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Show status
echo ""
echo "📊 Status:"
pm2 status
pm2 logs chinese-learning-bot --lines 10

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your bot should be running at: http://159.65.11.158:3000"
echo "📱 Update BotFather menu button to: http://159.65.11.158:3000"
