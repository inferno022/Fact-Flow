#!/bin/bash

# Ionic Appflow Build Script for Fact Flow

echo "Starting Fact Flow build process..."

# Install dependencies
npm ci

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

echo "Build completed successfully!"