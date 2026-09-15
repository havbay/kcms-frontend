# Hero Background Video Optimization Guide

This document explains how to optimize, maintain, and replace the background video for the KCMS landing page hero section.

---

## 1. Quick Start: Updating or Replacing the Video

Whenever you have a new video file to use as the hero background, follow these 3 steps:

### Step 1: Place Your Video
Put your high-resolution master video at:
```bash
public/videos/Video_background.mp4
```
*(Or keep it anywhere on your disk and pass the path in Step 2).*

### Step 2: Run the Optimization Script
In `kcms-frontend`:
```bash
npm run optimize:video
```
*(If your file is named something else or located elsewhere)*:
```bash
npm run optimize:video /path/to/my-new-video.mp4
```

### Step 3: Verify and Deploy
1. Run `npm run dev` to preview the new video and smooth crossfade locally.
2. Commit the generated files in `public/videos/`:
   ```bash
   git add public/videos/
   git commit -m "Update hero background video and poster"
   git push
   ```

> [!TIP]
> **No code changes are required!** The React component (`HeroBackgroundVideo.tsx`) and CSS always reference the standardized output paths. Swapping videos only requires re-running this script.

---

## 2. Prerequisites

The script requires `ffmpeg` and `cwebp` to be installed on your local machine:

### macOS (Homebrew)
```bash
brew install ffmpeg webp
```

### Ubuntu / Debian Linux
```bash
sudo apt update && sudo apt install ffmpeg webp
```

### Windows (Winget / Chocolatey)
```bash
winget install Gyan.FFmpeg
winget install Google.WebP
```

---

## 3. Generated Assets & Specifications

The raw video is too heavy (~7 MB, 5.8 Mbps, includes unnecessary audio) for a decorative web background. The optimizer produces four lightweight, tailored assets:

| Asset | File Path | Resolution | Format / Codec | Target Size | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Poster** | `public/videos/hero-poster.webp` | 1920x1080 | WebP (`q=82`) | **~31 KB** | Immediate initial paint; fallback for slow networks, blocked autoplay, and reduced-motion |
| **Desktop MP4** | `public/videos/hero-background.mp4` | 1920x1080 | H.264 High (`crf=26`, `+faststart`) | **~1.9 MB** | Universal fallback for Safari, older browsers, and desktop playback |
| **Desktop WebM** | `public/videos/hero-background.webm` | 1920x1080 | VP9 (`crf=32`) | **~2.0 MB** | Modern web codec for Chrome, Firefox, and Edge |
| **Mobile MP4** | `public/videos/hero-background-mobile.mp4` | 960x540 | H.264 (`crf=26`, `+faststart`) | **~560 KB** | Mobile devices (< 768px); avoids wasting cellular data on 1080p |

---

## 4. Manual FFmpeg Commands (Under the Hood)

If you ever need to run the commands manually without the script, here are the exact parameters:

### 1. WebP Poster Image
Extracts frame at 0.1s and encodes to WebP with matching color profile:
```bash
ffmpeg -ss 00:00:00.100 -i public/videos/Video_background.mp4 -frames:v 1 -update 1 /tmp/temp_poster.png -y && \
cwebp -q 82 /tmp/temp_poster.png -o public/videos/hero-poster.webp && \
rm /tmp/temp_poster.png
```
*(Or on FFmpeg builds compiled with `--enable-libwebp`)*:
```bash
ffmpeg -ss 00:00:00.100 -i public/videos/Video_background.mp4 -frames:v 1 -c:v libwebp -quality 82 -update 1 public/videos/hero-poster.webp
```

### 2. Desktop MP4 (H.264)
- `-an`: Strips the audio stream completely.
- `-c:v libx264 -preset slow -crf 26`: High visual fidelity at ~70% lower file size.
- `-pix_fmt yuv420p`: Maximum cross-browser compatibility.
- `-movflags +faststart`: Moves `moov` atom metadata to the start of the file so video starts streaming before the entire file downloads.
```bash
ffmpeg \
  -i public/videos/Video_background.mp4 \
  -an \
  -c:v libx264 \
  -preset slow \
  -crf 26 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  public/videos/hero-background.mp4
```

### 3. Desktop WebM (VP9)
```bash
ffmpeg \
  -i public/videos/Video_background.mp4 \
  -an \
  -c:v libvpx-vp9 \
  -crf 32 \
  -b:v 0 \
  -deadline good \
  -cpu-used 2 \
  public/videos/hero-background.webm
```

### 4. Mobile MP4 (960x540)
Scaled down to 540p for mobile bandwidth conservation:
```bash
ffmpeg \
  -i public/videos/Video_background.mp4 \
  -an \
  -vf "scale=960:540" \
  -c:v libx264 \
  -preset slow \
  -crf 26 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  public/videos/hero-background-mobile.mp4
```

---

## 5. How the Frontend Loads the Video

The component `HeroBackgroundVideo.tsx` implements a non-blocking, zero-CLS (Cumulative Layout Shift) loading sequence:

```
Hero Section (.lp-hero-section)
 ├── .lp-hero-media (absolute container, pointer-events: none, z-index: 0)
 │    ├── .lp-hero-poster (<img>, z-index: 0, immediate high-priority paint)
 │    ├── .lp-hero-video (<video>, z-index: 1, opacity: 0 -> 1 on 'playing' event)
 │    └── .lp-hero-overlay (<div>, z-index: 2, radial + linear SaaS readability wash)
 ├── .lp-glow (ambient teal glow, z-index: 2)
 └── .wrap / Hero Content (relative container, z-index: 3)
```

### Loading Sequence
1. **HTML & Poster Render**: The lightweight WebP poster is rendered immediately (`fetchPriority="high"`). Text and floating cards are instantly interactive.
2. **Video Buffering**: The browser fetches only metadata (`preload="metadata"`).
3. **Seamless Crossfade**: When playback starts and the native `playing` event fires, `.is-playing` is added, triggering a `750ms` CSS opacity transition from `0` to `1`.
4. **Permanent Poster Floor**: The poster remains underneath at `z-index: 0`. No white or black flashes are possible.
5. **Reduced Motion**: If `@media (prefers-reduced-motion: reduce)` is enabled, the `<video>` element is never loaded, displaying only the static poster.
6. **Autoplay Blocked / Slow Network**: If autoplay is denied or the connection fails, the poster continues displaying seamlessly without any error message or broken UI box.

---

## 6. Render Production Deployment Notes

1. **Pre-built Static Assets**:
   All video files are generated on your local machine and checked into Git under `public/videos/`. Vite copies them directly into `dist/videos/` during `npm run build`.
   > **Do not** install FFmpeg on the Render build machine. Video processing is strictly an offline pre-deployment task.

2. **HTTP 206 Partial Content (Byte-Range Requests)**:
   Render Static Sites natively support HTTP byte-range requests. With `-movflags +faststart`, browsers request small byte ranges (chunks) as needed during playback, rather than downloading the entire video upfront.

3. **Case Sensitivity**:
   All generated asset names use lowercase alphanumeric characters and hyphens (`hero-background.mp4`, `hero-poster.webp`). This avoids Linux 404 errors caused by case differences between macOS and Linux servers.

4. **Cache Invalidation**:
   If you replace the video in the future, modern browsers will detect the updated ETags or timestamps from Render.
