# Slide Preview Feature

## Overview
The slide preview feature allows users to see exactly what slides will be created **before** generating the final PowerPoint file. This provides transparency and confidence in the AI's output.

## What Was Added

### Backend Changes (server.js)

1. **New `/api/preview` Endpoint**
   - Calls Claude AI to structure content into slides
   - Returns JSON with slide structure and design theme
   - Does NOT generate the PPTX file (faster response)
   - Example response:
   ```json
   {
     "designTheme": {
       "name": "Professional Blue",
       "description": "Clean and corporate",
       "colorPrimary": "#1C2833",
       "colorSecondary": "#2E4053",
       "colorAccent": "#F39C12",
       "colorBackground": "#FFFFFF",
       "colorText": "#1d1d1d"
     },
     "slides": [
       {
         "type": "title",
         "title": "Main Title",
         "subtitle": "Subtitle"
       },
       {
         "type": "content",
         "title": "Slide Title",
         "content": ["Point 1", "Point 2", "Point 3"],
         "layout": "bullets"
       }
     ]
   }
   ```

2. **Updated `/api/generate` Endpoint**
   - Now accepts optional `slideData` parameter
   - If `slideData` is provided, skips AI call and uses cached data
   - Faster generation when preview was already created
   - Falls back to generating slide data if not provided (backward compatible)

### Frontend Changes (public/index.html)

1. **New "Preview Slides" Button**
   - Located next to "Generate PowerPoint" button
   - Calls `/api/preview` endpoint
   - Shows loading spinner during generation

2. **Enhanced Preview Panel**
   - Displays design theme name and description
   - Shows all slides with proper styling:
     - Title slides: colored background matching theme
     - Content slides: white background with colored accents
     - Slide numbers and layout indicators
     - Bullet points and two-column layouts
   - Uses theme colors from AI response

3. **Smart Generation Flow**
   - If preview already generated, uses cached data for faster PPTX generation
   - If no preview, automatically generates one before creating PPTX
   - Saves user from redundant AI calls

4. **Auto-Preview on Example Load**
   - When "Load example text" is clicked, preview auto-generates after 500ms
   - Demonstrates the feature immediately

## User Experience Flow

### Option 1: Preview First (Recommended)
1. Enter text content
2. Click "👁️ Preview Slides"
3. Review the slide structure
4. Click "✨ Generate PowerPoint" to create file

### Option 2: Direct Generation
1. Enter text content
2. Click "✨ Generate PowerPoint"
3. System auto-generates preview in background
4. Creates PPTX file

## Benefits

✅ **Transparency**: Users see what will be created before downloading  
✅ **Confidence**: Review AI's interpretation of content  
✅ **Speed**: Cached preview data makes final generation faster  
✅ **Design Preview**: See color scheme and theme before generation  
✅ **Content Review**: Verify slide titles and bullet points  
✅ **Layout Preview**: See which slides use two-column vs. bullet layouts  

## Technical Details

- Preview endpoint response time: ~3-5 seconds (Claude API call only)
- Generation with cached preview: ~10-15 seconds (HTML + conversion only)
- Generation without preview: ~15-20 seconds (Claude API + HTML + conversion)
- Preview data stored in browser memory (not localStorage)
- Preview cleared when page refreshes

## Visual Design

The preview panel shows:
- **Theme Badge**: Colored banner showing theme name and description
- **Slide Cards**: Individual cards for each slide
  - Slide number badge (colored with theme accent)
  - Slide type indicator (Title / Content / Two-column)
  - Title in appropriate size and color
  - Content bullets or columns
- **Color Scheme**: Matches actual PowerPoint theme colors
- **Scrollable Container**: Handles presentations with many slides

## Future Enhancements

Potential improvements:
- Edit slide content before generating
- Reorder slides via drag-and-drop
- Choose different color themes
- Add/remove slides
- Save preview to localStorage for persistence
- Export preview as image gallery

## Testing

To test the feature:
1. Start server: `npm start`
2. Open browser to `http://localhost:3000`
3. Save your Anthropic API key
4. Click "💡 Load example text"
5. Wait for auto-preview to appear
6. Click "Generate PowerPoint" to create file

## API Key Usage

- Preview: 1 API call to Claude
- Generate with preview: 0 additional API calls
- Generate without preview: 1 API call to Claude

**Cost optimization**: Generating preview first, then creating PPTX uses the same number of API calls as direct generation, but provides better UX.

