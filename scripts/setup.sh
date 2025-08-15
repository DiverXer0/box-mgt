#!/bin/bash

# Box Management System Setup Script
# This script sets up the application for first-time use

echo "🚀 Setting up Box Management System..."

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p uploads/receipts
mkdir -p uploads/temp

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 data
chmod 755 uploads
chmod 755 uploads/receipts
chmod 755 uploads/temp

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   Development: npm run dev"
echo "   Production:  npm start"
echo "   Docker:      docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "📖 Access the application at http://localhost:5000 (dev) or http://localhost (production)"