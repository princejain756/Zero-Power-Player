#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

echo "🍎 Preparing Zero-Power Player for Mac App Store Submission..."

# 1. Ensure fresh build exists
./scripts/build-macos.sh

APP_PATH="dist/Zero-Power Player.app"
PKG_PATH="dist/Zero-Power-Player-AppStore.pkg"

# 2. Check for signing identity
SIGN_IDENTITY=$(security find-identity -p basic -v | grep "Apple Distribution:" | head -n 1 | awk -F'"' '{print $2}' || true)
INSTALLER_IDENTITY=$(security find-identity -p basic -v | grep "3rd Party Mac Developer Installer:" | head -n 1 | awk -F'"' '{print $2}' || true)

if [ -f "embedded.provisionprofile" ]; then
  echo "📋 Embedding Mac App Store Provisioning Profile..."
  cp embedded.provisionprofile "${APP_PATH}/Contents/embedded.provisionprofile"
fi

echo "🧹 Stripping all extended quarantine attributes..."
xattr -rc "${APP_PATH}"
find "${APP_PATH}" -exec xattr -c {} + 2>/dev/null || true

if [ -z "$SIGN_IDENTITY" ]; then
  echo "⚠️ No 'Apple Distribution' certificate found in Keychain."
  echo "👉 For local testing/validation, applying ad-hoc codesigning with App Store sandbox entitlements..."
  codesign --force --deep --options runtime --entitlements entitlements.plist --sign - "${APP_PATH}"
else
  echo "🔑 Signing with certificate: ${SIGN_IDENTITY}..."
  codesign --force --deep --options runtime --entitlements entitlements.plist --sign "${SIGN_IDENTITY}" "${APP_PATH}"
fi

# 3. Validate signature and sandbox entitlements
echo "🔍 Validating codesign and sandbox entitlements..."
codesign -vvv --deep --strict "${APP_PATH}"
codesign -d --entitlements :- "${APP_PATH}"

# 4. Build .pkg installer for App Store Connect / Transporter
xattr -rc "${APP_PATH}"
find "${APP_PATH}" -exec xattr -c {} + 2>/dev/null || true

if [ -n "$INSTALLER_IDENTITY" ]; then
  echo "📦 Creating signed App Store .pkg using ${INSTALLER_IDENTITY}..."
  productbuild --component "${APP_PATH}" /Applications --sign "${INSTALLER_IDENTITY}" "${PKG_PATH}"
else
  echo "📦 Creating unsigned pre-flight App Store .pkg..."
  productbuild --component "${APP_PATH}" /Applications "${PKG_PATH}"
fi

echo ""
echo "============================================================"
echo "✅ Mac App Store Package Ready!"
echo "📍 Location: ${PKG_PATH}"
echo "📍 Standalone App: ${APP_PATH}"
echo ""
echo "🚀 Next Steps to Submit to App Store Connect:"
echo "1. Sign in to https://appstoreconnect.apple.com"
echo "2. Click '+' -> 'New App' -> macOS -> Choose Bundle ID: com.princejain.zeropowerplayer"
echo "3. Download 'Transporter' from the Mac App Store (free Apple app)."
echo "4. Drag and drop ${PKG_PATH} into Transporter and click 'Deliver'."
echo "5. Submit for Review in App Store Connect!"
echo "============================================================"
