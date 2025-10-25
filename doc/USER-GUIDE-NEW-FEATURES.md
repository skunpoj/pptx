# User Guide: New Features

## How to Use the Updated AI Text2PPT Pro

### Overview of Changes

The application now has a **unified workflow** where you can:
1. Describe what you want (using the prompt)
2. Optionally attach files to use as content or templates
3. Let AI generate slides based on your instructions

---

## Feature 1: Prompt-Controlled File Conversion

### Use Case: Convert Documents with Specific Instructions

**Example 1: Meeting Notes → Action-Focused Slides**

1. **Create your prompt:**
   ```
   Create a 5-slide presentation focusing on:
   - Key decisions made
   - Action items and owners
   - Next meeting date
   ```

2. **Attach your file:**
   - Click "📎 Attach Files"
   - Select `meeting-notes.txt`

3. **Click "Generate Content"**

4. **Result:** AI reads the meeting notes and structures them according to your prompt, focusing on decisions and actions rather than just summarizing everything.

---

**Example 2: Research Paper → Executive Summary**

1. **Prompt:**
   ```
   Convert this research into an executive summary presentation:
   - Main hypothesis and findings
   - Key data visualizations
   - Business implications
   - Recommended next steps
   ```

2. **Attach:** `research-paper.pdf`

3. **Generate**

4. **Result:** AI extracts key information and creates business-focused slides, not academic ones.

---

## Feature 2: PowerPoint Template Modification

### Use Case: Modify Existing Presentations

**Example: Update Company Template with New Content**

1. **Prompt:**
   ```
   Modify this template to present Q4 2024 results:
   - Revenue growth: 23%
   - New customers: 450
   - Market expansion: 3 new regions
   - Top achievement: Product launch success
   Keep the company branding and color scheme
   ```

2. **Attach:** `company-template.pptx`

3. **Generate**

4. **Result:** AI uses your PowerPoint file as the base template and modifies it with your Q4 data while preserving the design.

---

**Example: Repurpose Last Year's Presentation**

1. **Prompt:**
   ```
   Use this as a template but update with 2024 data:
   - Replace all 2023 metrics with 2024
   - Add section on AI initiatives
   - Update team photos
   - Keep same slide structure
   ```

2. **Attach:** `2023-annual-report.pptx`

3. **Generate**

4. **Result:** Same structure, updated content.

---

## Feature 3: Multiple Files Synthesis

### Use Case: Combine Multiple Documents

**Example: Create Unified Quarterly Review**

1. **Prompt:**
   ```
   Combine these documents into a unified Q4 presentation:
   - Start with sales overview
   - Then marketing highlights
   - Then product updates
   - End with Q1 outlook
   ```

2. **Attach multiple files:**
   - `sales-report.txt`
   - `marketing-summary.pdf`
   - `product-updates.doc`
   - `q1-forecast.txt`

3. **Generate**

4. **Result:** One cohesive presentation following your specified structure.

---

## Feature 4: Generate from Scratch (No Files)

### Use Case: Pure AI Generation

**Example:**

1. **Prompt:**
   ```
   Create a 6-slide presentation about sustainable business practices:
   - Intro to sustainability in business
   - Environmental benefits
   - Cost savings potential
   - Implementation strategies
   - Case studies
   - Call to action
   ```

2. **Don't attach files**

3. **Generate**

4. **Result:** AI creates complete content from scratch.

---

## Interface Guide

### Updated Layout

```
┌─────────────────────────────────────────────────────┐
│           🎨 AI Text2PPT Pro                        │
│     Professional presentations powered by AI         │
└─────────────────────────────────────────────────────┘

┌────────────────────────┬───────────────────────────┐
│  📝 Your Content       │  👁️ Slide Preview         │
│                        │                           │
│  ┌──────────────────┐ │                           │
│  │ 🤖 AI Generator  │ │   [Preview shows here]    │
│  │                  │ │                           │
│  │ Prompt:          │ │                           │
│  │ [Your text here] │ │                           │
│  │                  │ │                           │
│  │ 📎 Attach Files  │ │                           │
│  │ (optional):      │ │                           │
│  │ [Choose files]   │ │                           │
│  │                  │ │                           │
│  │ # Slides: [6]    │ │                           │
│  │ ☐ Gen images     │ │                           │
│  │                  │ │                           │
│  │ [Generate]       │ │                           │
│  └──────────────────┘ │                           │
│                        │                           │
│  📚 Example Templates  │                           │
│  [Tech] [Business]...  │                           │
│                        │                           │
│  [Text editor]         │                           │
│  [Preview] [Generate]  │                           │
└────────────────────────┴───────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   Footer                            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🔑 API Configuration (Click to expand)             │
│  Set up your API key here                           │
└─────────────────────────────────────────────────────┘
```

---

## Step-by-Step Workflow

### Complete Workflow Example

**Goal:** Create a presentation about your product launch

#### Step 1: Configure API (First Time Only)
1. Scroll to bottom of page
2. Click "🔑 API Configuration"
3. Select your AI provider (Anthropic/OpenAI/Gemini/OpenRouter)
4. Enter API key
5. Click "Save Key"
6. Collapse the section

#### Step 2: Describe Your Presentation
1. In the prompt field, type:
   ```
   Create a product launch presentation:
   - Problem we're solving
   - Our solution overview
   - Key features and benefits
   - Competitive advantages
   - Pricing and availability
   - Call to action
   Make it engaging for investors
   ```

#### Step 3: Attach Supporting Materials (Optional)
1. Click "📎 Attach Files"
2. Select files:
   - Product specs
   - Market research
   - Competitor analysis
   - Pricing sheet

#### Step 4: Configure Options
1. Set number of slides: `8`
2. Check "Generate AI images" if you want image placeholders

#### Step 5: Generate Content
1. Click "✨ Generate Content"
2. Wait for AI to process
3. Review generated content in the text editor

#### Step 6: Preview Slides
1. Click "👁️ Preview Slides"
2. Review the slide structure in the preview panel
3. Check theme, colors, layouts

#### Step 7: Make Adjustments (Optional)
1. Edit the generated text if needed
2. Regenerate preview to see changes

#### Step 8: Generate PowerPoint
1. Click "✨ Generate PowerPoint"
2. Wait for processing
3. Download your presentation!

---

## Tips and Best Practices

### Writing Effective Prompts

✅ **Good Prompts:**
- "Create a 5-slide sales pitch focusing on ROI and customer testimonials"
- "Convert this meeting transcript into action items and decisions"
- "Use this template but emphasize sustainability initiatives"

❌ **Less Effective:**
- "Make presentation"
- "Convert file"
- "Slides about stuff"

### File Upload Tips

1. **Supported formats:**
   - `.txt` - Plain text (best for raw content)
   - `.pdf` - PDF documents
   - `.doc`, `.docx` - Word documents
   - `.md` - Markdown files
   - `.pptx` - PowerPoint (as templates)

2. **File size:** Keep files reasonable (<5MB each)

3. **Multiple files:** Order doesn't matter, use prompt to specify structure

4. **PowerPoint templates:** Include branding/style instructions in prompt

### Number of Slides

- **3-6 slides:** Short presentations, quick updates
- **6-10 slides:** Standard business presentations
- **10-15 slides:** Detailed reports, comprehensive topics
- **15-20 slides:** Maximum, for very detailed content

### Image Generation

- Check "Generate AI images" if you want placeholders
- AI will suggest where images would enhance content
- Placeholders show what type of image to use

---

## Troubleshooting

### "Please enter your API key first"
→ Scroll to bottom, expand API Configuration, enter and save key

### "Please describe your presentation or attach files"
→ You need either a prompt OR files (or both)

### Preview looks different than expected
→ Edit the generated text, then click Preview again

### PowerPoint download fails
→ Check browser console for errors, verify API key is valid

### File won't upload
→ Check file type is supported (.txt, .pdf, .doc, .docx, .md, .pptx)

---

## Advanced Use Cases

### 1. Iterative Refinement

First pass:
```
Prompt: "Create presentation about AI in healthcare"
Generate → Review
```

Second pass:
```
Edit generated text to add specific examples
Preview → Adjust
```

Final pass:
```
Generate PowerPoint
```

### 2. Template Standardization

```
Prompt: "Use this corporate template for all quarterly reports.
Update with Q4 2024 data from attached files."

Attach:
- corporate-template.pptx
- q4-financials.txt
- q4-metrics.pdf

Generate
```

### 3. Multi-Source Compilation

```
Prompt: "Create comprehensive onboarding presentation combining:
- HR policies (from hr-handbook.pdf)
- Team structure (from org-chart.pptx)
- First week schedule (from onboarding-schedule.txt)
Organize by day 1, week 1, month 1"

Generate
```

---

## What's New (Summary)

| Feature | Before | After |
|---------|--------|-------|
| File Upload | Separate button | Integrated with prompt |
| Prompt Control | No file interaction | Controls file conversion |
| Template Support | Not available | PowerPoint templates supported |
| Placeholder Text | Generic description | Actual example text |
| API Section | Top of page | Bottom of page |
| Workflow | Multiple separate paths | Unified single workflow |

---

## Questions?

Check the documentation files:
- `FIXES-APPLIED.md` - Technical details
- `UI-CHANGES-SUMMARY.md` - Visual comparison
- `IMPLEMENTATION-COMPLETE.md` - Complete change summary

Enjoy creating amazing presentations! 🎨✨

