# Deployment Guide

## Architecture Overview

```
Frontend (Cloudflare Pages)
    ↓ API Calls
Backend (Google Cloud Droplet)
    ↓ Data
Database (Supabase)
Media → Cloudflare R2
```

## 1. Google Cloud Droplet Setup

### Create Droplet
1. Go to [Google Cloud](https://digitalocean.com)
2. Create → Droplets
3. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic ($6/month - 1GB RAM)
   - **Datacenter:** Closest to your users
   - **Authentication:** SSH Key (recommended) or Password
4. Click "Create Droplet"
5. Note your droplet IP address

### SSH into Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install Git
apt install -y git

# Create app directory
mkdir -p /var/www/chinese-learning-bot
cd /var/www/chinese-learning-bot
```

### Deploy Backend
```bash
# Clone your repo (or upload files)
git clone https://github.com/YOUR_USERNAME/chinese-learning-bot.git .

# Install dependencies
npm install

# Create .env file
nano .env
```

Add to `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
MINI_APP_URL=https://your-frontend.pages.dev
PORT=3000
NODE_ENV=production
```

### Start with PM2
```bash
# Create logs directory
mkdir logs

# Start the bot
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs chinese-learning-bot
```

### Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3000
ufw enable
```

### Install Nginx (Reverse Proxy)
```bash
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/chinese-learning-bot
```

Add:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/chinese-learning-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your:
   - Project URL: `https://xxx.supabase.co`
   - Anon/Public Key: `eyJ...`
   - Service Role Key: `eyJ...` (keep secret!)

### Create Tables
Run in Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  hsk_level INT DEFAULT 1,
  daily_goal INT DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary table
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  difficulty TEXT,
  hsk_level INT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User progress table
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  vocabulary_id INT REFERENCES vocabulary(id),
  mastery_level INT DEFAULT 0,
  last_reviewed TIMESTAMP,
  next_review TIMESTAMP,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  UNIQUE(user_id, vocabulary_id)
);

-- Lessons table
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  hsk_level INT NOT NULL,
  lesson_number INT NOT NULL,
  title TEXT NOT NULL,
  dialogue JSONB,
  vocabulary_ids INT[],
  grammar JSONB,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User lesson progress
CREATE TABLE user_lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  lesson_id INT REFERENCES lessons(id),
  completed BOOLEAN DEFAULT FALSE,
  progress INT DEFAULT 0,
  completed_at TIMESTAMP,
  UNIQUE(user_id, lesson_id)
);
```

### Add to Backend .env
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
```

## 3. Cloudflare R2 Setup

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. R2 → Create Bucket
3. Name: `chinese-learning-media`
4. Create API Token:
   - R2 → Manage R2 API Tokens
   - Create API Token
   - Permissions: Object Read & Write
5. Note:
   - Account ID
   - Access Key ID
   - Secret Access Key

### Add to Backend .env
```
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=chinese-learning-media
R2_PUBLIC_URL=https://your-r2-domain.com
```

## 4. Cloudflare Pages (Frontend)

### Install Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### Deploy Frontend
```bash
# From project root
wrangler pages deploy public --project-name=chinese-learning

# Or connect GitHub for auto-deploy:
# 1. Push to GitHub
# 2. Cloudflare Dashboard → Pages → Connect to Git
# 3. Select repo → Configure builds:
#    - Build output directory: public
#    - No build command needed
```

### Add Environment Variable
In Cloudflare Pages settings:
```
API_URL=http://YOUR_DROPLET_IP:3000
```

## 5. Update Frontend API Calls

Update all fetch calls in frontend files to use API_URL:
```javascript
// Add at top of flashcards.html, character-writing.html, quiz.html
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'http://YOUR_DROPLET_IP:3000'; // Or use domain with Nginx
```

## 6. Install SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get certificate (requires domain pointing to your IP)
certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

## 7. Update Telegram Bot Settings

1. Open [@BotFather](https://t.me/botfather)
2. `/mybots` → Select your bot
3. Bot Settings → Menu Button
4. Set URL to: `https://your-frontend.pages.dev`

## Maintenance Commands

### On Droplet
```bash
# View logs
pm2 logs chinese-learning-bot

# Restart bot
pm2 restart chinese-learning-bot

# Update code
cd /var/www/chinese-learning-bot
git pull
npm install
pm2 restart chinese-learning-bot

# Monitor
pm2 monit
```

## Scaling Later

### When you need more power:
1. **Upgrade Droplet** ($12/month for 2GB RAM)
2. **Add Load Balancer** (Google Cloud Load Balancer)
3. **Scale PM2** instances: `pm2 scale chinese-learning-bot 2`
4. **Add Redis** for caching (Google Cloud Managed Redis)
5. **Upgrade Supabase** tier if needed

## Cost Summary

| Service | Cost |
|---------|------|
| Google Cloud Droplet | $6/month |
| Supabase Free Tier | $0 |
| Cloudflare R2 (10GB) | $0 |
| Cloudflare Pages | $0 |
| **Total** | **$6/month** |
