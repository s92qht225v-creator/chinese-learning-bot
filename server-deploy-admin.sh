#!/bin/bash
# Run this command ON YOUR SERVER
# Copy and paste this into your server terminal

cd /var/www/chinese-learning-bot
git pull origin main
ls -la public/admin/
echo ""
echo "✅ Admin panel deployed!"
echo "🌐 Visit: http://lokatsiya.online/admin/"
echo "🔑 Password: admin123"
