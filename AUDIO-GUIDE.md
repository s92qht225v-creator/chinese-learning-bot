# 🔊 Audio Upload Guide

## How to Add Audio to Your Content

### Step 1: Upload Audio Files

You need to upload your audio files to a hosting service first. Here are your options:

#### **Option A: Google Drive** (Easiest for testing)
1. Upload your audio file to Google Drive
2. Right-click → Share → Copy link
3. Get direct link:
   - Change: `https://drive.google.com/file/d/FILE_ID/view`
   - To: `https://drive.google.com/uc?id=FILE_ID&export=download`

#### **Option B: Dropbox**
1. Upload audio file
2. Share → Copy link
3. Change `dl=0` to `dl=1` at the end of URL

#### **Option C: Supabase Storage** (Recommended for production)
1. Go to Supabase Dashboard → Storage
2. Create a bucket called `audio`
3. Make it public
4. Upload files
5. Copy the public URL

#### **Option D: Any CDN**
Upload to Cloudflare R2, AWS S3, or any CDN and get the public URL

### Step 2: Add Audio URLs in Admin Panel

#### **For Vocabulary:**
1. Go to http://lokatsiya.online/admin/
2. Click **📚 Vocabulary** tab
3. When adding/editing a word, you'll see an **"Audio URL"** field
4. Paste your audio URL: `https://example.com/audio.mp3`
5. Click **Add Vocabulary**

#### **For Dialogues:**
*(Coming soon - audio field will be added)*

#### **For Characters:**
*(Coming soon - audio field will be added)*

### Step 3: Test the Audio

1. Go to your app
2. Find the word/dialogue
3. Click the audio button 🔊
4. It should play!

## Audio File Recommendations

- **Format**: MP3 or OGG (MP3 is most compatible)
- **Quality**: 128kbps is fine for speech
- **Length**: Keep files short (1-5 seconds per word)
- **Naming**: Use pinyin for easy organization (e.g., `nihao.mp3`)

## Example Audio URLs

Here are some example formats that work:

```
https://example.com/audio/nihao.mp3
https://drive.google.com/uc?id=ABC123&export=download
https://dropbox.com/s/abc123/nihao.mp3?dl=1
https://tnpxusgdmnhixcjdpufy.supabase.co/storage/v1/object/public/audio/nihao.mp3
```

## Bulk Upload (For Many Files)

If you have hundreds of audio files, consider:

1. **Upload all to one place** (Supabase Storage, S3, etc.)
2. **Use consistent naming**: `word_pinyin.mp3`
3. **Script URL generation**: 
   ```javascript
   const baseUrl = 'https://example.com/audio/';
   const audioUrl = baseUrl + pinyin + '.mp3';
   ```

## Troubleshooting

### Audio not playing?
- ✅ Check URL is publicly accessible (open in browser)
- ✅ Make sure it's a direct link to the file (not a download page)
- ✅ Check CORS is enabled on your hosting service
- ✅ Try a different browser

### CORS Error?
Some hosting services need CORS configuration:
- **Supabase**: Already configured
- **S3/R2**: Add CORS policy in bucket settings
- **Google Drive**: May have restrictions, use Supabase instead

## Next Steps

Want me to:
1. Add audio fields to Dialogues and Characters forms?
2. Set up Supabase Storage for you?
3. Create a bulk upload script?

Just let me know!
