#!/bin/bash

set -e

echo "🧪 Testing package builds..."

# Test xmcp package build
echo "Testing xmcp package build..."
cd packages/xmcp
if [ ! -f "dist/index.js" ]; then
  echo "❌ xmcp package build failed - dist/index.js not found"
  exit 1
fi
if [ ! -f "dist/index.d.ts" ]; then
  echo "❌ xmcp package build failed - dist/index.d.ts not found"
  exit 1
fi
if [ ! -f "dist/cli.js" ]; then
  echo "❌ xmcp package build failed - dist/cli.js not found"
  exit 1
fi
echo "✅ xmcp package build successful"
cd ../..

# Test create-xmcp-app CLI build
echo "Testing create-xmcp-app CLI build..."
cd packages/create-xmcp-app
if [ ! -f "index.js" ]; then
  echo "❌ create-xmcp-app CLI build failed - index.js not found"
  exit 1
fi
echo "✅ create-xmcp-app CLI build successful"
cd ../..

echo "✅ All package builds verified successfully!" 