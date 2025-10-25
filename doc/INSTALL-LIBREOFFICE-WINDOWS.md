# Install LibreOffice on Windows for PDF Conversion

## Why LibreOffice?

Your application uses LibreOffice to convert PowerPoint presentations to PDF format. Without it, the PDF features won't work.

## Installation Steps

### Option A: Download Installer (Recommended)

1. **Download LibreOffice:**
   - Visit: https://www.libreoffice.org/download/download/
   - Click "Download" for Windows (x86_64)
   - File size: ~300MB

2. **Install:**
   - Run the downloaded `.msi` file
   - Follow the installation wizard
   - Default settings are fine
   - Installation path: `C:\Program Files\LibreOffice`

3. **Add to PATH:**
   - Open System Properties → Environment Variables
   - Edit "Path" in System Variables
   - Add: `C:\Program Files\LibreOffice\program`
   - Click OK

4. **Verify Installation:**
   ```powershell
   soffice --version
   ```
   Should output: `LibreOffice 7.x.x.x`

### Option B: Using Chocolatey (Package Manager)

If you have Chocolatey installed:

```powershell
# Run as Administrator
choco install libreoffice-fresh -y
```

### Option C: Using winget (Windows Package Manager)

```powershell
# Run as Administrator
winget install TheDocumentFoundation.LibreOffice
```

## After Installation

1. **Restart PowerShell** - Close and reopen your terminal

2. **Test the command:**
   ```powershell
   soffice --version
   ```

3. **Restart your Node.js server** - The application will automatically detect LibreOffice

## How It Works

Once installed, when you generate a presentation:
1. ✅ PPTX file is created immediately
2. ✅ LibreOffice automatically converts PPTX → PDF in the background
3. ✅ Both files are available for download
4. ✅ PDF viewer will work

## Alternative: Disable PDF Features

If you don't want to install LibreOffice, I can modify the app to:
- Hide PDF download/view buttons
- Only show PPTX download options
- Remove PDF-related features from the UI

Let me know which approach you prefer!

