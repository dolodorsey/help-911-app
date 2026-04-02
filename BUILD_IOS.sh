#!/bin/bash
# ═══════════════════════════════════════════════════════
# HELP 911 — iOS BUILD SCRIPT
# Run on Linda's Mac: bash BUILD_IOS.sh
# ═══════════════════════════════════════════════════════
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "═══════════════════════════════════════════"
echo "  🚑 HELP 911 — iOS Build"
echo "  Version 1.0.0 (Build 1)"
echo "  Bundle: com.help911.app"
echo "═══════════════════════════════════════════"
echo ""

# Check Xcode
echo -e "${YELLOW}Checking Xcode...${NC}"
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}ERROR: Xcode not found. Install from App Store.${NC}"
    exit 1
fi
XCODE_VER=$(xcodebuild -version | head -1)
echo -e "${GREEN}✅ $XCODE_VER${NC}"

# Check Node
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found. Install from nodejs.org${NC}"
    exit 1
fi
NODE_VER=$(node --version)
echo -e "${GREEN}✅ Node $NODE_VER${NC}"

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Build web assets
echo ""
echo -e "${YELLOW}🔨 Building production bundle...${NC}"
npm run build

# Sync to iOS
echo ""
echo -e "${YELLOW}📱 Syncing web build to iOS...${NC}"
npx cap sync ios

# Open in Xcode
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ BUILD COMPLETE — Opening Xcode${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "IN XCODE:"
echo "  1. Select 'App' target in the left sidebar"
echo "  2. Signing & Capabilities tab:"
echo "     → Team: Select Dr. Dorsey's Apple Developer account"
echo "     → Bundle ID should already be: com.help911.app"
echo ""
echo "  3. Product → Archive"
echo "  4. When archive completes → Distribute App"
echo "     → App Store Connect → Upload"
echo ""
echo "APP STORE CONNECT LISTING:"
echo "  App Name:     Help 911"
echo "  Subtitle:     Accident Recovery Concierge"
echo "  Category:     Medical (Primary) / Lifestyle (Secondary)"
echo "  Privacy URL:  https://help-911-app.vercel.app/privacy.html"
echo "  Support URL:  https://help-911-app.vercel.app/support.html"
echo "  Description:  Hurt in an accident? Help 911 connects you to"
echo "                treatment, transportation, attorney referrals,"
echo "                and 24/7 live support across Georgia."
echo ""
echo "  Keywords:     accident, injury, attorney, treatment,"
echo "                recovery, Georgia, clinic, help, 911"
echo ""
echo "  SCREENSHOTS NEEDED: 6.7\" iPhone and 5.5\" iPhone"
echo ""

npx cap open ios
