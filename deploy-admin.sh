#!/bin/bash

# Deploy admin panel to production server
# Usage: ./deploy-admin.sh

echo "🚀 Deploying admin panel to production..."

# Get server IP from .env
SERVER_IP=$(grep SERVER_IP .env | cut -d '=' -f2)

if [ -z "$SERVER_IP" ]; then
    echo "❌ SERVER_IP not found in .env file"
    echo "Please add SERVER_IP=your_server_ip to .env"
    exit 1
fi

echo "📦 Uploading admin panel to $SERVER_IP..."

# Upload admin folder to server
scp -r public/admin/ root@$SERVER_IP:/var/www/chinese-learning-bot/public/

if [ $? -eq 0 ]; then
    echo "✅ Admin panel uploaded successfully!"
    echo ""
    echo "🌐 Access your admin panel at: http://lokatsiya.online/admin/"
    echo "🔑 Default password: admin123"
    echo ""
    echo "⚠️  Important: Change the admin password in admin/index.html (line 369)"
else
    echo "❌ Deployment failed!"
    exit 1
fi
