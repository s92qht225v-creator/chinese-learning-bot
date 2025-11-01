#!/bin/bash

# Local deployment script - run this on your Mac
# Usage: ./deploy-local.sh

set -e  # Exit on error

echo "🚀 Starting deployment from local machine..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server details
SERVER_USER="root"
SERVER_IP="34.17.122.31"
SERVER_PATH="/var/www/chinese-learning-bot"

echo -e "${BLUE}📦 Step 1: Checking git status...${NC}"
git status --short

echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Step 2: Adding files to git...${NC}"
git add public/quiz-comprehensive.html \
        public/quiz-levels.html \
        public/flashcards.html \
        public/admin/admin-quiz-creator.html \
        database.js \
        migrations/ \
        QUIZ-COMPREHENSIVE-INTEGRATION.md \
        2>/dev/null || true

echo -e "${GREEN}✓ Files staged${NC}"

echo ""
echo -e "${BLUE}💬 Step 3: Committing changes...${NC}"
read -p "Enter commit message (or press Enter for default): " COMMIT_MSG

if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="Add comprehensive quiz system, fix flashcards back button, update quiz_questions schema"
fi

git commit -m "$COMMIT_MSG" 2>/dev/null || echo -e "${YELLOW}No changes to commit${NC}"
echo -e "${GREEN}✓ Changes committed${NC}"

echo ""
echo -e "${BLUE}🔄 Step 4: Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✓ Pushed to GitHub${NC}"

echo ""
echo -e "${BLUE}🌐 Step 5: Deploying to server $SERVER_IP...${NC}"
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
    echo "📂 Navigating to project directory..."
    cd /var/www/chinese-learning-bot
    
    echo "⬇️  Pulling latest changes..."
    git pull origin main
    
    echo "📦 Installing dependencies (if needed)..."
    npm install --production 2>&1 | grep -E "(added|removed|changed|vulnerabilities)" || true
    
    echo "🔄 Restarting application with PM2..."
    pm2 restart chinese-learning-bot
    
    echo ""
    echo "📊 Application status:"
    pm2 status chinese-learning-bot
    
    echo ""
    echo "✅ Server deployment complete!"
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📋 IMPORTANT: Complete these manual steps:${NC}"
    echo ""
    echo "1. 🗄️  Run database migration in Supabase SQL Editor:"
    echo "   Open: https://supabase.com/dashboard/project/aveoqedskzbbgcazpskn/sql/new"
    echo "   File: migrations/fix-quiz-questions-schema.sql"
    echo "   Copy SQL content and click RUN"
    echo ""
    echo "2. ✅ Test the application:"
    echo "   https://lokatsiya.online"
    echo "   Try: Practice → Quizzes → Select Level → Take Quiz"
    echo ""
    echo "3. 📝 Check Admin Panel:"
    echo "   https://lokatsiya.online/admin/"
    echo "   Password: admin123"
    echo "   Add some quiz questions for testing"
    echo ""
    echo "4. 🔍 Check server logs if needed:"
    echo "   ssh root@34.17.122.31"
    echo "   pm2 logs chinese-learning-bot"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check the error messages above."
    exit 1
fi
