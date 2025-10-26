# Admin Panel Deployment Guide

## Option 1: Via Git (Recommended)

Since SSH isn't configured, the easiest way is to commit and pull from your server:

```bash
# 1. Commit the admin folder to git
git add admin/
git commit -m "Add admin panel"
git push origin main

# 2. SSH into your server (you might need to do this via browser console or another method)
ssh root@159.65.11.158

# 3. On the server, pull the changes
cd /var/www/lingo.uz
git pull origin main

# 4. Verify the files
ls -la admin/
```

## Option 2: Manual Upload via SFTP

Use an SFTP client like FileZilla or Cyberduck:

1. **Host:** 159.65.11.158
2. **Username:** root
3. **Port:** 22 (or your custom SSH port)
4. **Upload the `admin` folder to:** `/var/www/lingo.uz/`

## Option 3: Create on Server Directly

```bash
# SSH into server
ssh root@159.65.11.158

# Navigate to web directory
cd /var/www/lingo.uz

# Create admin directory
mkdir -p admin

# Create the admin panel file
nano admin/index.html
# Then paste the contents from your local admin/index.html
```

## After Deployment

1. **Test the admin panel:**
   - Visit: https://lingo.uz/admin/
   - Default password: `admin123`

2. **Change the admin password:**
   ```bash
   ssh root@159.65.11.158
   nano /var/www/lingo.uz/admin/index.html
   # Find line 369: const ADMIN_PASSWORD = 'admin123';
   # Change to a secure password
   ```

3. **Verify it's working:**
   - Login with your password
   - Check Analytics tab loads
   - Try adding a vocabulary word
   - Check Users tab

## Troubleshooting

If you get 404 errors:

```bash
# Check if files exist
ssh root@159.65.11.158
ls -la /var/www/lingo.uz/admin/

# Check Nginx is serving static files
sudo nginx -t
sudo systemctl restart nginx
```

If CORS errors occur:
- Check browser console
- Update Supabase allowed origins to include `lingo.uz` and `*.lingo.uz`
