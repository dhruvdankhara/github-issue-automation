#!/bin/bash

# Vercel build script
echo "Starting Vercel build process..."

# Set Node.js version
export NODE_VERSION=18

# Clear any previous builds
rm -rf dist/
rm -rf node_modules/.vite/

# Install dependencies with legacy peer deps to avoid conflicts
npm install --legacy-peer-deps

# Run TypeScript compilation
npx tsc -b

# Build with Vite
npx vite build --mode production

echo "Build completed successfully!"
