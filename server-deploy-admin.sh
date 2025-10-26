#!/bin/bash
# Run this command ON YOUR SERVER
# Copy and paste this into your server terminal

cd /var/www/lingo.uz
git pull origin main
ls -la admin/
echo ""
echo "✅ Admin panel deployed!"
echo "🌐 Visit: https://lingo.uz/admin/"
echo "🔑 Password: admin123"
