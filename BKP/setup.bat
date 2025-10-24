@echo off
REM PowerPoint Presentation Generator Setup Script for Windows
REM This script installs all necessary dependencies and sets up the environment

echo PowerPoint Presentation Generator Setup
echo ======================================

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed.
    echo Please install Python 3.8+ from https://python.org and run this script again.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is required but not installed.
    echo Please install Node.js 16+ from https://nodejs.org and run this script again.
    pause
    exit /b 1
)

echo ✅ Python and Node.js are installed

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
) else (
    echo ✅ Python dependencies installed successfully
)

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

if errorlevel 1 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
) else (
    echo ✅ Node.js dependencies installed successfully
)

REM Install html2pptx globally
echo 📦 Installing html2pptx globally...
npm install -g ./skill/html2pptx.tgz

if errorlevel 1 (
    echo ❌ Failed to install html2pptx
    pause
    exit /b 1
) else (
    echo ✅ html2pptx installed successfully
)

REM Check for LibreOffice
echo 🔍 Checking for LibreOffice...
where soffice >nul 2>&1
if errorlevel 1 (
    echo ⚠️  LibreOffice not found.
    echo Please install LibreOffice from https://www.libreoffice.org/download/
    echo This is required for PowerPoint conversion.
) else (
    echo ✅ LibreOffice is installed
)

REM Check for Poppler (pdftoppm)
echo 🔍 Checking for Poppler...
where pdftoppm >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Poppler not found.
    echo Please install Poppler from https://poppler.freedesktop.org/
    echo Or use Windows Subsystem for Linux (WSL) with Ubuntu.
) else (
    echo ✅ Poppler is installed
)

REM Create .env file template
echo 📝 Creating environment file template...
(
echo # Gemini API Configuration
echo GEMINI_API_KEY=your_gemini_api_key_here
echo.
echo # Optional: Set default values
echo DEFAULT_TONE=professional
echo DEFAULT_COLOR_PALETTE=blue
echo DEFAULT_SLIDE_COUNT=10
) > .env.template

echo ✅ Created .env.template file

echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
echo 2. Set your API key: set GEMINI_API_KEY=your_api_key_here
echo 3. Run the application: python app.py
echo 4. Or try examples: python example_usage.py
echo.
echo For more information, see README.md
echo.
pause
