#!/usr/bin/env bash
set -euo pipefail

# KCMS Hero Video Optimizer
# Generates production-ready, lightweight assets for the hero section:
# 1. hero-poster.webp (~31 KB)
# 2. hero-background.mp4 (~1.9 MB, H.264 High + faststart, no audio)
# 3. hero-background.webm (~2.0 MB, VP9, no audio)
# 4. hero-background-mobile.mp4 (~560 KB, 540p H.264 + faststart, no audio)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${ROOT_DIR}/public/videos"
mkdir -p "${OUTPUT_DIR}"

INPUT_FILE="${1:-${OUTPUT_DIR}/Video_background.mp4}"

if [[ ! -f "${INPUT_FILE}" ]]; then
  echo "Error: Input video not found at: ${INPUT_FILE}"
  echo "Usage: $0 [path/to/source_video.mp4]"
  echo "Or place the file at: ${OUTPUT_DIR}/Video_background.mp4"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: 'ffmpeg' is required but not installed."
  echo "Install on macOS with: brew install ffmpeg"
  exit 1
fi

echo "=========================================="
echo "KCMS Hero Video Optimization"
echo "Source: ${INPUT_FILE}"
echo "Target: ${OUTPUT_DIR}"
echo "=========================================="

# 1. WebP Poster Image
echo ""
echo "[1/4] Generating WebP poster (hero-poster.webp)..."
TEMP_FRAME="/tmp/kcms_hero_poster_$$.png"
ffmpeg -v error -y -ss 00:00:00.100 -i "${INPUT_FILE}" -frames:v 1 -update 1 "${TEMP_FRAME}"

if command -v cwebp &> /dev/null; then
  cwebp -q 82 "${TEMP_FRAME}" -o "${OUTPUT_DIR}/hero-poster.webp" > /dev/null 2>&1
  rm -f "${TEMP_FRAME}"
elif ffmpeg -encoders 2>&1 | grep -q libwebp; then
  ffmpeg -v error -y -ss 00:00:00.100 -i "${INPUT_FILE}" -frames:v 1 -c:v libwebp -quality 82 -update 1 "${OUTPUT_DIR}/hero-poster.webp"
  rm -f "${TEMP_FRAME}"
else
  # Fallback to PNG if WebP tools are missing
  mv "${TEMP_FRAME}" "${OUTPUT_DIR}/hero-poster.png"
  echo "Notice: 'cwebp' not found. Generated hero-poster.png fallback."
fi

# 2. Desktop MP4 (H.264, +faststart, no audio)
echo "[2/4] Encoding Desktop MP4 (hero-background.mp4)..."
ffmpeg -v error -y \
  -i "${INPUT_FILE}" \
  -an \
  -c:v libx264 \
  -preset slow \
  -crf 26 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "${OUTPUT_DIR}/hero-background.mp4"

# 3. Desktop WebM (VP9, no audio)
echo "[3/4] Encoding Desktop WebM (hero-background.webm)..."
ffmpeg -v error -y \
  -i "${INPUT_FILE}" \
  -an \
  -c:v libvpx-vp9 \
  -crf 32 \
  -b:v 0 \
  -deadline good \
  -cpu-used 2 \
  "${OUTPUT_DIR}/hero-background.webm"

# 4. Mobile MP4 (540p, +faststart, no audio)
echo "[4/4] Encoding Mobile MP4 540p (hero-background-mobile.mp4)..."
ffmpeg -v error -y \
  -i "${INPUT_FILE}" \
  -an \
  -vf "scale=960:540" \
  -c:v libx264 \
  -preset slow \
  -crf 26 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  "${OUTPUT_DIR}/hero-background-mobile.mp4"

echo ""
echo "=========================================="
echo "Optimization Complete! Generated Assets:"
echo "=========================================="
ls -lh "${OUTPUT_DIR}/hero-poster"* "${OUTPUT_DIR}/hero-background"*
echo "=========================================="
