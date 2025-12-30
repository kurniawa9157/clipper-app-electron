# YouTube Clipper - Setup Guide

## 📋 Prerequisites

Before running the application, you need to download the required binaries:

### 1. yt-dlp (YouTube Downloader)

Download the latest Windows executable:
- Visit: https://github.com/yt-dlp/yt-dlp/releases/latest
- Download: `yt-dlp.exe`
- Place in: `d:/Clipper App/resources/binaries/yt-dlp.exe`

### 2. FFmpeg (Video Processing)

Download FFmpeg for Windows:
- Visit: https://www.gyan.dev/ffmpeg/builds/
- Download: `ffmpeg-release-essentials.zip`
- Extract and copy these files to `d:/Clipper App/resources/binaries/`:
  - `ffmpeg.exe`
  - `ffprobe.exe`

### 3. Google Gemini API Key

Get your free API key:
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google account
- Click "Create API Key"
- Copy the key (starts with `AIza...`)

---

## 🚀 Running the Application

### Development Mode

```bash
cd "d:/Clipper App"
npm install
npm run dev
```

The application will open automatically.

### First Run Setup

1. **Click the "Settings" button** in the top-right corner
2. **Enter your Gemini API Key**
3. **(Optional) Configure output directory**
4. **Click "Save Settings"**

---

## 📁 Directory Structure

```
d:/Clipper App/
├── resources/
│   └── binaries/           # ← Place binaries here
│       ├── yt-dlp.exe
│       ├── ffmpeg.exe
│       └── ffprobe.exe
├── downloads/              # Downloaded videos (auto-created)
├── output/                 # Generated clips (auto-created)
└── thumbnails/             # Clip previews (auto-created)
```

---

## 🎬 How to Use

1. **Enter YouTube URL**
   - Paste any YouTube video link

2. **Configure Settings**
   - Choose genre (Auto, Gaming, Podcast, etc.)
   - Set clip duration (30-120 seconds)
   - Set number of clips (1-50)
   - *(Optional)* Add transcript for faster processing

3. **Click "MULAI NG-CLIP"**
   - Watch progress: Download → AI Analysis → Generate Clips

4. **Review Generated Clips**
   - See thumbnails, scores, and viral hooks
   - Click "Generate" to create individual clips

5. **Export Clips**
   - Find generated videos in the `output` folder

---

## ⚠️ Troubleshooting

### "API key not configured"
- Go to Settings and enter your Gemini API key

### "Failed to download video"
- Check that `yt-dlp.exe` is in `resources/binaries/`
- Make sure the YouTube URL is valid
- Try updating yt-dlp to the latest version

### "FFmpeg error"
- Verify `ffmpeg.exe` and `ffprobe.exe` are in `resources/binaries/`
- Check that the video file downloaded successfully

### App won't start
- Make sure you ran `npm install`
- Check Node.js version (requires 16+)
- Try deleting `node_modules` and running `npm install` again

---

## 📊 API Limits

**Google Gemini Free Tier:**
- 60 requests per minute
- 1,500 requests per day
- Sufficient for ~150 video analyses per day

---

## 🔧 Building for Production

```bash
# Build Windows installer
npm run build:win

# Output: release/EZ Tool - Trend Clipper Setup.exe
```

---

## 📞 Support

For issues or questions:
- Check the walkthrough document
- Review error messages in the app
- Ensure all binaries are correctly placed

---

**Ready to create viral clips! 🎉**
