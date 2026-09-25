#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🔨 Building Zero-Power Player native macOS application..."

APP_NAME="Zero-Power Player"
BUNDLE_DIR="dist/${APP_NAME}.app"
CONTENTS_DIR="${BUNDLE_DIR}/Contents"
MACOS_DIR="${CONTENTS_DIR}/MacOS"
RESOURCES_DIR="${CONTENTS_DIR}/Resources"
WWW_DIR="${RESOURCES_DIR}/www"

# 1. Clean previous build
rm -rf dist/
mkdir -p "${MACOS_DIR}" "${WWW_DIR}"

# 2. Compile native Swift executable (Universal 2: Apple Silicon + Intel)
echo "⚡ Compiling Swift WebKit native launcher (Universal: arm64 + x86_64)..."
swiftc -O -target arm64-apple-macos12.0 src-macos/main.swift -o "/tmp/ZeroPowerPlayer_arm64"
swiftc -O -target x86_64-apple-macos12.0 src-macos/main.swift -o "/tmp/ZeroPowerPlayer_x86_64"
lipo -create "/tmp/ZeroPowerPlayer_arm64" "/tmp/ZeroPowerPlayer_x86_64" -output "${MACOS_DIR}/ZeroPowerPlayer"
rm -f "/tmp/ZeroPowerPlayer_arm64" "/tmp/ZeroPowerPlayer_x86_64"

chmod +x "${MACOS_DIR}/ZeroPowerPlayer"

# 3. Copy web assets to www/
echo "📦 Packaging web application assets..."
cp -r index.html icon.png icon_macos.png css js manifest.json sw.js "${WWW_DIR}/"

# 4. Generate AppIcon.icns with Apple HIG squircle
if [ -f "LOGOUSE THIS.png" ]; then
  echo "🎨 Generating Apple HIG squircle icon..."
  python3 scripts/make_macos_icon.py "LOGOUSE THIS.png" "icon_macos.png"
  ICONSET_DIR="/tmp/icon.iconset"
  rm -rf "$ICONSET_DIR"
  mkdir -p "$ICONSET_DIR"
  sips -z 16 16     icon_macos.png --out "$ICONSET_DIR/icon_16x16.png" >/dev/null
  sips -z 32 32     icon_macos.png --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null
  sips -z 32 32     icon_macos.png --out "$ICONSET_DIR/icon_32x32.png" >/dev/null
  sips -z 64 64     icon_macos.png --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null
  sips -z 128 128   icon_macos.png --out "$ICONSET_DIR/icon_128x128.png" >/dev/null
  sips -z 256 256   icon_macos.png --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null
  sips -z 256 256   icon_macos.png --out "$ICONSET_DIR/icon_256x256.png" >/dev/null
  sips -z 512 512   icon_macos.png --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null
  sips -z 512 512   icon_macos.png --out "$ICONSET_DIR/icon_512x512.png" >/dev/null
  sips -z 1024 1024 icon_macos.png --out "$ICONSET_DIR/icon_512x512@2x.png" >/dev/null
  iconutil -c icns "$ICONSET_DIR" -o AppIcon.icns
  rm -rf "$ICONSET_DIR"
fi

if [ -f "AppIcon.icns" ]; then
  cp AppIcon.icns "${RESOURCES_DIR}/AppIcon.icns"
fi

# 5. Generate Info.plist
cat << 'EOF' > "${CONTENTS_DIR}/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>ZeroPowerPlayer</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon.icns</string>
    <key>CFBundleIdentifier</key>
    <string>com.princejain.zeropowerplayer</string>
    <key>CFBundleName</key>
    <string>Zero-Power Player</string>
    <key>CFBundleDisplayName</key>
    <string>Zero-Power Player</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundleVersion</key>
    <string>5</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.music</string>
    <key>ITSAppUsesNonExemptEncryption</key>
    <false/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 Prince Jain. All rights reserved.</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSRequiresAquaSystemAppearance</key>
    <false/>
</dict>
</plist>
EOF

# Strip all extended attributes (com.apple.quarantine etc.)
xattr -rc "${BUNDLE_DIR}"
find "${BUNDLE_DIR}" -exec xattr -c {} + 2>/dev/null || true

# 6. Install to ~/Applications for current user
echo "🚀 Installing to ~/Applications..."
mkdir -p "$HOME/Applications"
rm -rf "$HOME/Applications/${APP_NAME}.app"
cp -R "${BUNDLE_DIR}" "$HOME/Applications/"

# 7. Create standalone distributable .dmg disk image
echo "💿 Generating DMG package for sharing/releases..."
DMG_NAME="Zero-Power-Player-macOS.dmg"
DMG_STAGE="/tmp/dmg_stage"
rm -rf "$DMG_STAGE" "dist/${DMG_NAME}"
mkdir -p "$DMG_STAGE"
cp -R "${BUNDLE_DIR}" "$DMG_STAGE/"
ln -s /Applications "$DMG_STAGE/Applications"
hdiutil create -volname "${APP_NAME}" -srcfolder "$DMG_STAGE" -ov -format UDZO "dist/${DMG_NAME}" >/dev/null
rm -rf "$DMG_STAGE"

echo "✅ Build & Installation complete!"
echo "📍 Installed in: $HOME/Applications/${APP_NAME}.app"
echo "📍 DMG Installer: dist/${DMG_NAME}"
