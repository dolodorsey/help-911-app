#!/bin/bash
# ═══════════════════════════════════════════
# HELP 911 — iOS Build Script
# Run this on Linda's Mac with Xcode 26
# ═══════════════════════════════════════════

set -e

echo "🚑 HELP 911 iOS Build Starting..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build web assets
echo "🔨 Building production bundle..."
npm run build

# 3. Sync to iOS
echo "📱 Syncing to iOS..."
npx cap sync ios

# 4. Open in Xcode
echo "🛠️ Opening Xcode..."
npx cap open ios

echo ""
echo "═══════════════════════════════════════════"
echo "✅ HELP 911 ready in Xcode!"
echo ""
echo "NEXT STEPS IN XCODE:"
echo "1. Select 'App' target"
echo "2. Set Team → Dr. Dorsey's Apple Dev account"
echo "3. Set Bundle ID → com.help911.app"
echo "4. Set Display Name → Help 911"
echo "5. Add 1024x1024 app icon in Assets.xcassets"
echo "6. Product → Archive → Distribute to App Store"
echo ""
echo "APP STORE CONNECT INFO:"
echo "  App Name: Help 911"
echo "  Subtitle: Accident Recovery Concierge"
echo "  Category: Medical / Lifestyle"
echo "  Privacy URL: https://help-911-app.vercel.app/privacy.html"
echo "  Support URL: https://help-911-app.vercel.app/support.html"
echo "═══════════════════════════════════════════"
