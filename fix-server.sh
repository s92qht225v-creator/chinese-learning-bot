#!/bin/bash

# Server Troubleshooting and Fix Script
# Run this ON YOUR SERVER: ssh root@159.65.11.158
# Then: bash fix-server.sh

echo "🔍 Starting server diagnostics and fixes..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check 1: Nginx
echo "1️⃣ Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx NOT running - Starting...${NC}"
    systemctl start nginx && echo -e "${GREEN}✓ Started${NC}"
fi
echo ""

# Check 2: Nginx Config
echo "2️⃣ Checking Nginx configuration..."
if [ ! -f "/etc/nginx/sites-available/lingo.uz" ]; then
    echo -e "${YELLOW}Creating Nginx config...${NC}"
    
    cat > /etc/nginx/sites-available/lingo.uz << 'EOF'
server {
    listen 80;
    server_name lingo.uz www.lingo.uz;

    root /var/www/lingo.uz/public;
    index index.html;

    location / {
        try_files $uri $uri/ @nodejs;
    }

    location /admin {
        alias /var/www/lingo.uz/admin;
        try_files $uri $uri/ /admin/index.html;
    }

    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/lingo.uz /etc/nginx/sites-enabled/
    echo -e "${GREEN}✓ Config created${NC}"
fi

nginx -t && systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Check 3: PM2
echo "3️⃣ Checking Node.js app..."
pm2 status
if ! pm2 list | grep -q "chinese-learning-bot"; then
    echo -e "${YELLOW}Starting app...${NC}"
    cd /var/www/lingo.uz
    pm2 start ecosystem.config.js
    pm2 save
fi
echo ""

# Check 4: Pull latest code
echo "4️⃣ Deploying latest code..."
cd /var/www/lingo.uz
git pull origin main
echo ""

# Check 5: Admin Panel
echo "5️⃣ Checking admin panel..."
if [ -f "/var/www/lingo.uz/admin/index.html" ]; then
    echo -e "${GREEN}✓ Admin panel exists${NC}"
    ls -lh /var/www/lingo.uz/admin/
else
    echo -e "${RED}✗ Admin panel missing!${NC}"
fi
echo ""

# Check 6: Port 3000
echo "6️⃣ Checking port 3000..."
if netstat -tuln | grep -q ":3000"; then
    echo -e "${GREEN}✓ App listening on port 3000${NC}"
else
    echo -e "${RED}✗ Nothing on port 3000${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📋 SUMMARY"
echo "=========================================="
echo ""
echo "🌐 Access your site:"
echo "   Main: http://lingo.uz"
echo "   Admin: http://lingo.uz/admin"
echo "   Direct IP: http://159.65.11.158:3000"
echo ""
echo "🔑 Admin credentials:"
echo "   Password: admin123"
echo "   (Change in admin/index.html line 369)"
echo ""
echo "📝 Useful commands:"
echo "   pm2 logs chinese-learning-bot --lines 50"
echo "   tail -f /var/log/nginx/error.log"
echo "   systemctl status nginx"
echo "   pm2 restart chinese-learning-bot"
echo ""
echo "🔒 To set up HTTPS:"
echo "   certbot --nginx -d lingo.uz -d www.lingo.uz"
echo ""
