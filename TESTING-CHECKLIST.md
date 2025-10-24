# Testing Checklist - AI Text2PPT Pro

## Pre-Testing Setup

### Prerequisites
- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] Anthropic API key ready
- [ ] Server running on port 3000

### Start Server
```bash
node server.js
```

Expected output:
```
🚀 AI Text2PPT Pro Server Running!

📍 Open your browser to: http://localhost:3000

✨ Professional presentations powered by Claude AI + html2pptx
```

---

## Test Suite

### 1. Initial Setup Tests ✓

#### Test 1.1: API Key Configuration
- [ ] Open http://localhost:3000
- [ ] Enter API key in the input field
- [ ] Click "Save Key"
- [ ] Verify green "active" border appears
- [ ] Verify success message shows
- [ ] Refresh page and confirm key persists

**Expected:** API key saved in localStorage, green border, success message

#### Test 1.2: Page Load
- [ ] All sections visible
- [ ] No console errors
- [ ] All buttons enabled (except generate if no preview)
- [ ] Text area has placeholder text
- [ ] Example category buttons visible (6 buttons)
- [ ] AI Prompt Generator section visible

**Expected:** Clean page load with all UI elements

---

### 2. Example Category Tests ✓

#### Test 2.1: Technology Category
- [ ] Click "💻 Technology" button
- [ ] Verify content loads into text area
- [ ] Verify status message: "📝 Tech example loaded..."
- [ ] Content should be about AI in Healthcare
- [ ] Content should be 4-6 paragraphs

**Expected:** Healthcare AI content loaded, status message shown

#### Test 2.2: Business Category
- [ ] Click "💼 Business" button
- [ ] Verify content about Digital Transformation loads
- [ ] Check status message

**Expected:** Business content loaded correctly

#### Test 2.3: All Categories
Repeat for each category:
- [ ] 📚 Education
- [ ] 🏥 Healthcare (Mental Health)
- [ ] 📈 Marketing
- [ ] 🌍 Environment

**Expected:** Each loads unique, relevant content

---

### 3. AI Prompt Generator Tests ✓

#### Test 3.1: Basic Prompt
- [ ] Clear text area
- [ ] Enter prompt: "Create a presentation about cybersecurity basics for small businesses"
- [ ] Click "✨ Generate Content from Idea"
- [ ] Wait for generation (10-20 seconds)
- [ ] Verify content appears in text area
- [ ] Verify success status message
- [ ] Content should be 4-6 paragraphs
- [ ] Content should match the prompt topic

**Expected:** AI-generated content about cybersecurity for small businesses

#### Test 3.2: Detailed Prompt
- [ ] Use prompt: "Generate slides about machine learning algorithms including neural networks, decision trees, and random forests with practical examples for data scientists"
- [ ] Click generate
- [ ] Verify detailed content generated
- [ ] Content should cover all mentioned topics

**Expected:** Comprehensive content matching detailed requirements

#### Test 3.3: Short Prompt
- [ ] Use prompt: "Climate change solutions"
- [ ] Click generate
- [ ] Verify content generated despite brevity

**Expected:** AI expands short prompt into full content

#### Test 3.4: Error Cases
- [ ] Try generating without API key
  - **Expected:** Error message about API key required
- [ ] Try generating with empty prompt
  - **Expected:** Error message about prompt required
- [ ] Try with invalid API key
  - **Expected:** API authentication error message

---

### 4. Preview Generation Tests ✓

#### Test 4.1: Preview from Example
- [ ] Load any example category
- [ ] Click "👁️ Preview Slides"
- [ ] Wait for preview generation
- [ ] Verify loading spinner appears
- [ ] Verify status message updates
- [ ] Preview appears in right panel
- [ ] Check theme card displays (color scheme)
- [ ] Verify 4-8 slides shown
- [ ] Each slide has title
- [ ] Content slides have bullet points
- [ ] First slide is title slide

**Expected:** Preview shows structured slides with theme

#### Test 4.2: Preview from AI-Generated Content
- [ ] Generate content using AI prompt generator
- [ ] Click "👁️ Preview Slides"
- [ ] Verify preview works same as examples

**Expected:** Preview generation successful

#### Test 4.3: Preview from Manual Input
- [ ] Paste custom text (your own content)
- [ ] Must be at least 3-4 paragraphs
- [ ] Click "👁️ Preview Slides"
- [ ] Verify slides generated

**Expected:** Custom content converted to slides

#### Test 4.4: Preview Error Cases
- [ ] Try preview with empty text area
  - **Expected:** "Please enter some text!" error
- [ ] Try preview without API key
  - **Expected:** "Please enter your API key first!" error
- [ ] Try preview with very short text (1 sentence)
  - **Expected:** Should work but may create minimal slides

---

### 5. PowerPoint Generation Tests ✓

#### Test 5.1: Generate After Preview
- [ ] Load example content
- [ ] Generate preview
- [ ] Wait for preview to complete
- [ ] Click "✨ Generate PowerPoint"
- [ ] Wait for generation (15-30 seconds)
- [ ] Verify loading states show
- [ ] File downloads automatically
- [ ] File named "AI-Presentation-Pro.pptx"
- [ ] Open file in PowerPoint
- [ ] Verify slides match preview
- [ ] Check all content rendered correctly
- [ ] Verify colors match theme

**Expected:** PowerPoint file downloads and opens correctly

#### Test 5.2: Generate Without Preview
- [ ] Load new content
- [ ] Click "✨ Generate PowerPoint" directly (without preview)
- [ ] Verify preview auto-generates first
- [ ] Then PowerPoint generates
- [ ] File downloads

**Expected:** Auto-preview then generation works

#### Test 5.3: Multiple Generations
- [ ] Load example 1, generate preview, generate PPTX
- [ ] Load example 2, generate preview, generate PPTX
- [ ] Verify each creates separate file
- [ ] Both files should be different

**Expected:** Can generate multiple presentations in session

---

### 6. UI/UX Tests ✓

#### Test 6.1: Button States
- [ ] Verify buttons disable during operations
- [ ] Verify spinners appear during loading
- [ ] Verify buttons re-enable after completion
- [ ] Check button text changes during operations

**Expected:** Clear loading states, no accidental double-clicks

#### Test 6.2: Status Messages
- [ ] All operations show status messages
- [ ] Success messages are green
- [ ] Error messages are red
- [ ] Info messages are blue
- [ ] Messages are clear and helpful

**Expected:** User always knows what's happening

#### Test 6.3: Responsive Behavior
- [ ] Resize browser window
- [ ] Verify layout adjusts (mobile view below 768px)
- [ ] All features remain accessible

**Expected:** Works on different screen sizes

---

### 7. Error Handling Tests ✓

#### Test 7.1: Network Errors
- [ ] Disconnect internet
- [ ] Try generating preview
- [ ] Verify clear error message
- [ ] Reconnect internet
- [ ] Retry successfully

**Expected:** Graceful error handling, recovery works

#### Test 7.2: Invalid API Key
- [ ] Enter fake API key
- [ ] Try generating content/preview
- [ ] Verify "Invalid API key" error
- [ ] Update to valid key
- [ ] Retry successfully

**Expected:** Clear API key error, easy to fix

#### Test 7.3: Server Errors
- [ ] Stop server
- [ ] Try any operation
- [ ] Verify error displayed
- [ ] Restart server
- [ ] Retry successfully

**Expected:** Server error detected and shown

---

### 8. Integration Tests ✓

#### Test 8.1: Complete Workflow - Example Template
1. [ ] Open application
2. [ ] Save API key
3. [ ] Click Technology example
4. [ ] Click Preview Slides
5. [ ] Review preview
6. [ ] Click Generate PowerPoint
7. [ ] Download file
8. [ ] Open in PowerPoint
9. [ ] Verify complete presentation

**Expected:** End-to-end success in under 2 minutes

#### Test 8.2: Complete Workflow - AI Generator
1. [ ] Open application
2. [ ] Save API key
3. [ ] Enter custom prompt
4. [ ] Generate content
5. [ ] Review generated text
6. [ ] Generate preview
7. [ ] Review preview
8. [ ] Generate PowerPoint
9. [ ] Download and verify

**Expected:** End-to-end success in under 3 minutes

#### Test 8.3: Complete Workflow - Manual Input
1. [ ] Open application
2. [ ] Save API key
3. [ ] Paste your own content
4. [ ] Generate preview
5. [ ] Edit content if needed
6. [ ] Regenerate preview
7. [ ] Generate PowerPoint
8. [ ] Verify output

**Expected:** Full workflow with editing works

---

### 9. Edge Cases ✓

#### Test 9.1: Very Long Content
- [ ] Input 15+ paragraphs
- [ ] Generate preview
- [ ] Verify AI creates appropriate number of slides (should be 7-8 max)

**Expected:** AI handles long content intelligently

#### Test 9.2: Very Short Content
- [ ] Input 2 paragraphs
- [ ] Generate preview
- [ ] Verify at least 3-4 slides created

**Expected:** AI expands minimal content

#### Test 9.3: Special Characters
- [ ] Input text with: quotes, apostrophes, em-dashes, bullets
- [ ] Generate preview and PowerPoint
- [ ] Verify special chars render correctly

**Expected:** Special characters handled properly

#### Test 9.4: Non-English Content
- [ ] Try content in different language (if applicable)
- [ ] Generate preview
- [ ] Verify works correctly

**Expected:** Unicode content supported

---

### 10. Performance Tests ✓

#### Test 10.1: Response Times
- [ ] Preview generation: should complete in 5-15 seconds
- [ ] Content generation: should complete in 10-20 seconds
- [ ] PowerPoint generation: should complete in 15-30 seconds

**Expected:** Reasonable wait times, clear progress indicators

#### Test 10.2: Multiple Operations
- [ ] Generate 5 presentations in a row
- [ ] Verify no performance degradation
- [ ] Check for memory leaks in DevTools

**Expected:** Consistent performance

---

### 11. Browser Compatibility ✓

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

**Expected:** Works consistently across browsers

---

### 12. Security Tests ✓

#### Test 12.1: API Key Storage
- [ ] Save API key
- [ ] Open DevTools → Application → Local Storage
- [ ] Verify key stored only locally
- [ ] Clear storage
- [ ] Verify key removed

**Expected:** Secure local storage only

#### Test 12.2: XSS Prevention
- [ ] Try inputting HTML/script tags in content
- [ ] Generate preview
- [ ] Verify tags escaped/not executed

**Expected:** XSS protection works

---

## Known Issues / Limitations

### Current Limitations
1. Maximum slide count: 8 slides
2. No image upload (only placeholders)
3. No chart customization in preview
4. PowerPoint themes are AI-selected (not user-selectable)
5. No template saving feature yet

### Workarounds
1. For more slides: Split into multiple presentations
2. For images: Add them in PowerPoint after generation
3. For custom themes: Edit colors in PowerPoint after download

---

## Test Results Template

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | API Key Config | ⬜ | |
| 1.2 | Page Load | ⬜ | |
| 2.1 | Tech Category | ⬜ | |
| 2.2 | Business Category | ⬜ | |
| 2.3 | All Categories | ⬜ | |
| 3.1 | Basic Prompt | ⬜ | |
| 3.2 | Detailed Prompt | ⬜ | |
| 3.3 | Short Prompt | ⬜ | |
| 3.4 | Prompt Errors | ⬜ | |
| 4.1 | Preview from Example | ⬜ | |
| 4.2 | Preview from AI | ⬜ | |
| 4.3 | Preview Manual | ⬜ | |
| 4.4 | Preview Errors | ⬜ | |
| 5.1 | Generate After Preview | ⬜ | |
| 5.2 | Generate Without Preview | ⬜ | |
| 5.3 | Multiple Generations | ⬜ | |
| 6.1 | Button States | ⬜ | |
| 6.2 | Status Messages | ⬜ | |
| 6.3 | Responsive | ⬜ | |
| 7.1 | Network Errors | ⬜ | |
| 7.2 | Invalid API Key | ⬜ | |
| 7.3 | Server Errors | ⬜ | |
| 8.1 | Workflow: Example | ⬜ | |
| 8.2 | Workflow: AI | ⬜ | |
| 8.3 | Workflow: Manual | ⬜ | |

Legend: ⬜ Not Tested | ✅ Pass | ❌ Fail | ⚠️ Issues

---

## Bug Report Template

```
**Test ID:** [e.g., 3.1]
**Test Name:** [e.g., Basic Prompt]
**Status:** ❌ Fail

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Browser:** [e.g., Chrome 120]
**Error Messages:**


**Screenshots:** [if applicable]

**Additional Notes:**

```

---

## Post-Testing

After completing all tests:
1. [ ] Document all findings
2. [ ] Report critical bugs
3. [ ] Note performance issues
4. [ ] Suggest improvements
5. [ ] Confirm all major features work

---

## Quick Smoke Test (5 minutes)

For quick validation:
1. [ ] Load page
2. [ ] Save API key
3. [ ] Click Technology example
4. [ ] Preview slides
5. [ ] Generate PowerPoint
6. [ ] Verify download works

If this passes, basic functionality is working.

---

## Continuous Testing

Recommended for ongoing development:
- Run smoke test after each deployment
- Full test suite weekly
- User acceptance testing monthly
- Performance monitoring continuously

---

*Last Updated: October 24, 2025*

