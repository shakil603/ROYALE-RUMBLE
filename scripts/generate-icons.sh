#!/usr/bin/env bash
set -e

SRC_IMG="src/assets/images/royale_rumble_icon_1790517303961.jpg"
RES_DIR="android/app/src/main/res"

if [ ! -f "$SRC_IMG" ]; then
  echo "Source icon not found at $SRC_IMG"
  exit 1
fi

mkdir -p "$RES_DIR/mipmap-mdpi"
mkdir -p "$RES_DIR/mipmap-hdpi"
mkdir -p "$RES_DIR/mipmap-xhdpi"
mkdir -p "$RES_DIR/mipmap-xxhdpi"
mkdir -p "$RES_DIR/mipmap-xxxhdpi"
mkdir -p "$RES_DIR/drawable"

# Generate genuine PNG icons at standard Android mipmap resolutions
ffmpeg -y -i "$SRC_IMG" -vf scale=48:48 "$RES_DIR/mipmap-mdpi/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=48:48 "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"

ffmpeg -y -i "$SRC_IMG" -vf scale=72:72 "$RES_DIR/mipmap-hdpi/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=72:72 "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"

ffmpeg -y -i "$SRC_IMG" -vf scale=96:96 "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=96:96 "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"

ffmpeg -y -i "$SRC_IMG" -vf scale=144:144 "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=144:144 "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"

ffmpeg -y -i "$SRC_IMG" -vf scale=192:192 "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=192:192 "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"

ffmpeg -y -i "$SRC_IMG" -vf scale=192:192 "$RES_DIR/drawable/ic_launcher.png"
ffmpeg -y -i "$SRC_IMG" -vf scale=192:192 "$RES_DIR/drawable/ic_launcher_round.png"

echo "All Android launcher icons generated successfully from Royale Rumble source image!"
