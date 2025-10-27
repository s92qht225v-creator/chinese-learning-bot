#!/bin/bash
# Script to update dialogue management section

# Backup current file
cp public/admin/index.html public/admin/index.html.backup-$(date +%s)

echo "Backup created"
echo "Ready to update dialogue section"
echo "Run migrations/seed-dialogues.sql in Supabase first!"
