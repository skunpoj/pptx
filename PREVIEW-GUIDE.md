# Slide Preview Visual Guide

## What You'll See

When you click "👁️ Preview Slides", the right panel displays a visual representation of your presentation.

## Preview Components

### 1. Theme Header
```
┌────────────────────────────────────────┐
│ 🎨 Professional Healthcare Theme       │
│ Clean and trustworthy colors suited    │
│ for medical and healthcare content     │
└────────────────────────────────────────┘
```
Shows the AI-selected theme name and why it was chosen for your content.

### 2. Title Slide (Slide 1)
```
┌────────────────────────────────────────┐
│ [Slide 1] [Title Slide]                │
│                                        │
│   The Future of AI in Healthcare       │
│   Revolutionizing Medical Care         │
│                                        │
└────────────────────────────────────────┘
```
- Colored background (matches theme primary color)
- Large title text
- Optional subtitle
- White text on colored background

### 3. Content Slide - Bullet Layout
```
┌────────────────────────────────────────┐
│ [Slide 2] [bullets]                    │
│                                        │
│ Key Applications                       │
│                                        │
│ • Early cancer detection               │
│ • Predictive analytics                 │
│ • Robotic surgery assistance           │
│ • Virtual health assistants            │
│                                        │
└────────────────────────────────────────┘
```
- White background
- Colored title (theme primary)
- Bullet points
- Clean, readable layout

### 4. Content Slide - Two-Column Layout
```
┌────────────────────────────────────────┐
│ [Slide 3] [two-column]                 │
│                                        │
│ Benefits & Challenges                  │
│                                        │
│ • Improved accuracy    • Data privacy  │
│ • Faster diagnosis     • Regulations   │
│ • Cost reduction       • Bias concerns │
│                                        │
└────────────────────────────────────────┘
```
- White background
- Colored title
- Content split into two columns
- Balanced distribution

## Color Indicators

Each slide preview uses colors from the AI-selected theme:
- **Primary Color**: Slide titles, title slide background
- **Accent Color**: Slide number badges
- **Background Color**: Slide backgrounds (white for content)
- **Text Color**: Body text

## Interactive Elements

### Preview Button States

**Idle:**
```
┌─────────────────┐
│ 👁️ Preview Slides │
└─────────────────┘
```

**Loading:**
```
┌─────────────────┐
│ ⏳ Generating...  │
└─────────────────┘
```

**Ready:**
```
┌─────────────────┐
│ 👁️ Preview Slides │
└─────────────────┘
```

### Generate Button Behavior

- **Before Preview**: Generates preview automatically, then creates PPTX
- **After Preview**: Uses cached data, creates PPTX immediately

## Status Messages

You'll see different status messages:

1. **Generating Preview:**
   ```
   ℹ️ 🤖 AI is analyzing your content...
   ```

2. **Preview Ready:**
   ```
   ✅ Preview ready! Click "Generate PowerPoint" to create your file.
   ```

3. **Generating PPTX:**
   ```
   ℹ️ 📊 Generating your professional PowerPoint...
   ```

4. **Complete:**
   ```
   ✅ Professional presentation downloaded successfully!
   ```

## Scrolling Preview

The preview panel is scrollable, so you can see all slides even in longer presentations:

```
┌────────────────────────────────────────┐
│ 👁️ Slide Preview              [scroll] │
├────────────────────────────────────────┤
│                                        │
│ [Theme Header]                         │
│                                        │
│ [Slide 1 - Title]                      │
│                                        │
│ [Slide 2 - Content]                    │
│                                        │
│ [Slide 3 - Content]                    │
│                                        ▲
│ [Slide 4 - Content]                    │
│                                        │
│ [Slide 5 - Content]                    │
│                                        ▼
└────────────────────────────────────────┘
```

## Example Preview

Here's what a full preview might look like:

```
╔════════════════════════════════════════╗
║ 🎨 Modern Tech Theme                   ║
║ Vibrant colors for technology content  ║
╚════════════════════════════════════════╝

┌────────────────────────────────────────┐
│ [Slide 1] [Title Slide]         🔵     │
│                                        │
│        Cloud Computing Guide           │
│        Modern Infrastructure           │
│                                        │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [Slide 2] [bullets]             🟠     │
│                                        │
│ What is Cloud Computing?               │
│                                        │
│ • On-demand computing resources        │
│ • Pay-as-you-go pricing model         │
│ • Scalable infrastructure              │
│ • Global accessibility                 │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [Slide 3] [two-column]          🟠     │
│                                        │
│ Pros and Cons                          │
│                                        │
│ • Cost effective       • Internet      │
│ • Scalability           dependency     │
│ • Flexibility          • Security      │
│ • Maintenance free      concerns       │
└────────────────────────────────────────┘
```

## Design Principles

The preview follows these principles:

1. **Accurate Representation**: Colors and layouts match final PPTX
2. **Readable Text**: Font sizes scaled for preview panel
3. **Visual Hierarchy**: Clear distinction between slide types
4. **Compact Display**: Multiple slides visible without scrolling
5. **Professional Look**: Clean, modern design

## Tips for Best Results

✅ **Use descriptive content** - AI creates better slide titles  
✅ **Include structure** - Paragraphs help AI identify topics  
✅ **Review preview** - Verify slide organization before generating  
✅ **Check theme** - Ensure colors match your presentation context  

## Troubleshooting Preview

If preview doesn't appear:
1. ✓ API key is saved and valid
2. ✓ Text content is entered
3. ✓ Check status message for errors
4. ✓ Browser console for technical errors
5. ✓ Try reloading the page

## Mobile Responsiveness

On mobile devices:
- Preview appears below content input
- Slides stack vertically
- Touch scrolling enabled
- Buttons stack for easier tapping

