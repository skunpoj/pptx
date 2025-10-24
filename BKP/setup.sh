#!/bin/bash

# PowerPoint Presentation Generator Setup Script
# This script installs all necessary dependencies and sets up the environment

echo "PowerPoint Presentation Generator Setup"
echo "======================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8+ and run this script again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js 16+ and run this script again."
    exit 1
fi

echo "✅ Python and Node.js are installed"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully"
else
    echo "❌ Failed to install Python dependencies"
    exit 1
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Node.js dependencies installed successfully"
else
    echo "❌ Failed to install Node.js dependencies"
    exit 1
fi

# Install html2pptx globally
echo "📦 Installing html2pptx globally..."
npm install -g ./skill/html2pptx.tgz

if [ $? -eq 0 ]; then
    echo "✅ html2pptx installed successfully"
else
    echo "❌ Failed to install html2pptx"
    exit 1
fi

# Check for system dependencies
echo "🔍 Checking system dependencies..."

# Check for LibreOffice
if ! command -v soffice &> /dev/null; then
    echo "⚠️  LibreOffice not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y libreoffice
    elif command -v brew &> /dev/null; then
        brew install --cask libreoffice
    elif command -v yum &> /dev/null; then
        sudo yum install -y libreoffice
    else
        echo "❌ Please install LibreOffice manually for your system"
        echo "   Visit: https://www.libreoffice.org/download/"
    fi
else
    echo "✅ LibreOffice is installed"
fi

# Check for Poppler (pdftoppm)
if ! command -v pdftoppm &> /dev/null; then
    echo "⚠️  Poppler not found. Installing..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y poppler-utils
    elif command -v brew &> /dev/null; then
        brew install poppler
    elif command -v yum &> /dev/null; then
        sudo yum install -y poppler-utils
    else
        echo "❌ Please install Poppler manually for your system"
        echo "   Visit: https://poppler.freedesktop.org/"
    fi
else
    echo "✅ Poppler is installed"
fi

# Create .env file template
echo "📝 Creating environment file template..."
cat > .env.template << EOF
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Set default values
DEFAULT_TONE=professional
DEFAULT_COLOR_PALETTE=blue
DEFAULT_SLIDE_COUNT=10
EOF

echo "✅ Created .env.template file"

# Make scripts executable
chmod +x app.py
chmod +x example_usage.py

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Set your API key: export GEMINI_API_KEY='your_api_key_here'"
echo "3. Run the application: python app.py"
echo "4. Or try examples: python example_usage.py"
echo ""
echo "For more information, see README.md"
