#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building and linking init-xmcp CLI...${NC}\n"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Error: This script must be run from the init-xmcp directory${NC}"
    echo -e "${YELLOW}Please navigate to packages/init-xmcp and run this script${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}\n"
fi

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
rm -rf dist/
echo -e "${GREEN}✅ Cleaned${NC}\n"

# Build TypeScript
echo -e "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}\n"

# Check if already linked and unlink if necessary
echo -e "${YELLOW}🔗 Checking for existing global link...${NC}"
if npm list -g init-xmcp > /dev/null 2>&1; then
    echo -e "${YELLOW}Found existing global link, unlinking...${NC}"
    npm unlink -g init-xmcp
fi

# Link the package globally
echo -e "${YELLOW}🔗 Linking package globally...${NC}"
npm link
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link package${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Package linked successfully!${NC}\n"

# Test the CLI
echo -e "${BLUE}🧪 Testing the CLI...${NC}"
if command -v init-xmcp > /dev/null 2>&1; then
    init-xmcp --help
    echo -e "\n${GREEN}🎉 Success! You can now use 'init-xmcp' globally${NC}"
    echo -e "${BLUE}💡 Try: init-xmcp --help${NC}"
    echo -e "${BLUE}💡 Try: init-xmcp --nextjs --yes${NC}"
    echo -e "${BLUE}💡 Try: init-xmcp --express --tools-path lib/tools --yes${NC}"
else
    echo -e "${RED}❌ CLI not found in PATH. You may need to restart your terminal.${NC}"
fi

echo -e "\n${YELLOW}📝 To unlink later, run: npm unlink -g init-xmcp${NC}" 