#!/bin/bash

# PowerPoint Generator with Gemini AI - Startup Script

echo "🎯 PowerPoint Generator with Gemini AI"
echo "======================================"

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  Warning: GEMINI_API_KEY environment variable is not set"
    echo "   You can set it by running: export GEMINI_API_KEY=your_api_key_here"
    echo "   Or create a .env file with: GEMINI_API_KEY=your_api_key_here"
    echo ""
fi

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "🐳 Running in Docker container"
    echo "   Web interface will be available at: http://localhost:5000"
    echo "   API endpoints:"
    echo "   - POST /api/generate - Generate presentation outline"
    echo "   - POST /api/convert/<session_id> - Convert to PowerPoint"
    echo "   - GET /api/download/<session_id>/<filename> - Download file"
    echo ""
fi

# Start the application
echo "🚀 Starting PowerPoint Generator..."
echo ""

# Run the web application
python app.py --web
