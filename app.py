#!/usr/bin/env python3
"""
PowerPoint Presentation Generator using Gemini AI and html2pptx

This web application uses Google's Gemini AI to generate presentation content
and converts it to PowerPoint using the html2pptx skill.
"""

import os
import json
import tempfile
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import google.generativeai as genai
from dataclasses import dataclass
from flask import Flask, request, jsonify, send_file, render_template_string
from flask_cors import CORS
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


@dataclass
class PresentationConfig:
    """Configuration for presentation generation."""
    topic: str
    tone: str
    target_audience: str
    slide_count: int
    color_palette: str
    include_charts: bool = False
    include_images: bool = False


class GeminiPresentationGenerator:
    """Main class for generating presentations using Gemini AI."""
    
    def __init__(self, api_key: str):
        """Initialize the generator with Gemini API key."""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        self.temp_dir = None
        
    def generate_presentation_outline(self, config: PresentationConfig) -> Dict:
        """Generate a detailed presentation outline using Gemini."""
        prompt = f"""
        Create a detailed presentation outline for the following requirements:
        
        Topic: {config.topic}
        Tone: {config.tone}
        Target Audience: {config.target_audience}
        Number of Slides: {config.slide_count}
        Color Palette: {config.color_palette}
        Include Charts: {config.include_charts}
        Include Images: {config.include_images}
        
        Please provide a JSON response with the following structure:
        {{
            "title": "Presentation Title",
            "subtitle": "Brief subtitle or tagline",
            "slides": [
                {{
                    "slide_number": 1,
                    "type": "title",
                    "title": "Slide Title",
                    "content": "Main content or description",
                    "speaker_notes": "Notes for the presenter",
                    "layout": "title_slide",
                    "chart_data": null
                }},
                {{
                    "slide_number": 2,
                    "type": "content",
                    "title": "Slide Title",
                    "content": "Main content or description",
                    "speaker_notes": "Notes for the presenter",
                    "layout": "two_column",
                    "chart_data": {{
                        "type": "bar",
                        "title": "Chart Title",
                        "data": [{{"label": "Q1", "value": 100}}, {{"label": "Q2", "value": 150}}]
                    }}
                }}
            ]
        }}
        
        For slide types, use: title, content, comparison, process, conclusion
        For layouts, use: title_slide, single_column, two_column, three_column, full_slide
        For chart types, use: bar, line, pie, scatter (only if include_charts is true)
        
        Make the content engaging, professional, and appropriate for the target audience.
        """
        
        try:
            print(f"Calling Gemini API with prompt length: {len(prompt)}")
            response = self.model.generate_content(prompt)
            print(f"Gemini API response received: {type(response)}")
            
            # Extract JSON from response
            content = response.text.strip()
            print(f"Raw response content (first 500 chars): {content[:500]}")
            
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            
            # Try to find JSON in the response if it's not at the start
            if not content.startswith('{'):
                # Look for JSON object in the response
                start_idx = content.find('{')
                if start_idx != -1:
                    content = content[start_idx:]
                    # Find the matching closing brace
                    brace_count = 0
                    end_idx = start_idx
                    for i, char in enumerate(content):
                        if char == '{':
                            brace_count += 1
                        elif char == '}':
                            brace_count -= 1
                            if brace_count == 0:
                                end_idx = i + 1
                                break
                    content = content[:end_idx]
            
            print(f"Processed content for JSON parsing: {content[:200]}...")
            
            parsed_json = json.loads(content)
            print(f"Successfully parsed JSON with {len(parsed_json.get('slides', []))} slides")
            return parsed_json
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Content that failed to parse: {content}")
            # Return a fallback outline
            return self._create_fallback_outline(config)
        except Exception as e:
            print(f"Error generating outline: {e}")
            print(f"Exception type: {type(e)}")
            # Return a fallback outline
            return self._create_fallback_outline(config)
    
    def _create_fallback_outline(self, config: PresentationConfig) -> Dict:
        """Create a simple fallback outline when Gemini API fails."""
        print("Creating fallback outline due to API failure")
        
        slides = []
        
        # Title slide
        slides.append({
            "slide_number": 1,
            "type": "title",
            "title": config.topic,
            "content": f"An overview of {config.topic}",
            "speaker_notes": f"Introduce the topic: {config.topic}",
            "layout": "title_slide",
            "chart_data": None
        })
        
        # Content slides
        for i in range(2, min(config.slide_count + 1, 8)):  # Limit to 7 additional slides
            slide_num = i
            slide_title = f"Key Point {slide_num - 1}"
            slide_content = f"This slide covers an important aspect of {config.topic}. " \
                          f"Content would be tailored for {config.target_audience} " \
                          f"in a {config.tone} tone."
            
            slides.append({
                "slide_number": slide_num,
                "type": "content",
                "title": slide_title,
                "content": slide_content,
                "speaker_notes": f"Discuss key point {slide_num - 1} about {config.topic}",
                "layout": "single_column",
                "chart_data": None
            })
        
        # Conclusion slide
        slides.append({
            "slide_number": len(slides) + 1,
            "type": "conclusion",
            "title": "Conclusion",
            "content": f"Summary of key points about {config.topic}",
            "speaker_notes": f"Wrap up the presentation on {config.topic}",
            "layout": "single_column",
            "chart_data": None
        })
        
        return {
            "title": config.topic,
            "subtitle": f"Presented to {config.target_audience}",
            "slides": slides
        }
    
    def create_html_slides(self, outline: Dict, config: PresentationConfig) -> List[str]:
        """Create HTML files for each slide based on the outline."""
        if not self.temp_dir:
            self.temp_dir = tempfile.mkdtemp()
        
        html_files = []
        
        # Create shared CSS file
        css_content = self._create_shared_css(config.color_palette)
        css_path = Path(self.temp_dir) / "shared.css"
        css_path.write_text(css_content)
        
        for slide_data in outline["slides"]:
            html_content = self._create_slide_html(slide_data, config)
            slide_file = Path(self.temp_dir) / f"slide_{slide_data['slide_number']}.html"
            slide_file.write_text(html_content)
            html_files.append(str(slide_file))
        
        return html_files
    
    def _create_shared_css(self, color_palette: str) -> str:
        """Create shared CSS with color palette overrides."""
        color_schemes = {
            "blue": {
                "primary": "#1791e8",
                "primary_foreground": "#ffffff",
                "secondary": "#f5f5f5",
                "accent": "#e3f2fd"
            },
            "green": {
                "primary": "#4caf50",
                "primary_foreground": "#ffffff", 
                "secondary": "#f5f5f5",
                "accent": "#e8f5e8"
            },
            "purple": {
                "primary": "#9c27b0",
                "primary_foreground": "#ffffff",
                "secondary": "#f5f5f5", 
                "accent": "#f3e5f5"
            },
            "orange": {
                "primary": "#ff9800",
                "primary_foreground": "#ffffff",
                "secondary": "#f5f5f5",
                "accent": "#fff3e0"
            },
            "red": {
                "primary": "#f44336",
                "primary_foreground": "#ffffff",
                "secondary": "#f5f5f5",
                "accent": "#ffebee"
            }
        }
        
        colors = color_schemes.get(color_palette.lower(), color_schemes["blue"])
        
        return f"""
        :root {{
            --color-primary: {colors['primary']};
            --color-primary-foreground: {colors['primary_foreground']};
            --color-secondary: {colors['secondary']};
            --color-accent: {colors['accent']};
            --color-surface: #ffffff;
            --color-surface-foreground: #1d1d1d;
            --color-muted: #f5f5f5;
            --color-muted-foreground: #737373;
            --color-border: #c8c8c8;
            
            --font-family-display: Arial, sans-serif;
            --font-family-content: Arial, sans-serif;
            --font-weight-display: 600;
            --font-weight-content: 400;
            --font-size-content: 16px;
            --line-height-content: 1.4;
            
            --spacing: 0.25rem;
            --gap: calc(var(--spacing) * 4);
            --radius: 0.4rem;
            --radius-pill: 999em;
        }}
        
        body {{
            width: 960px;
            height: 540px;
            overflow: hidden;
            margin: 0;
            padding: 0;
            font-family: var(--font-family-content);
            background: var(--color-surface);
            color: var(--color-surface-foreground);
        }}
        
        .row {{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: stretch;
        }}
        
        .col {{
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: center;
        }}
        
        .center {{
            align-items: center;
            justify-content: center;
        }}
        
        .fill-width {{
            flex: 1;
        }}
        
        .fill-height {{
            flex: 1;
        }}
        
        .fit {{
            flex: none;
        }}
        
        .gap {{
            gap: var(--gap);
        }}
        
        .gap-lg {{
            gap: calc(var(--gap) * 2);
        }}
        
        .p-4 {{
            padding: calc(var(--spacing) * 4);
        }}
        
        .p-8 {{
            padding: calc(var(--spacing) * 8);
        }}
        
        .text-center {{
            text-align: center;
        }}
        
        .text-primary {{
            color: var(--color-primary);
        }}
        
        .text-muted-foreground {{
            color: var(--color-muted-foreground);
        }}
        
        .bg-primary {{
            background-color: var(--color-primary);
            color: var(--color-primary-foreground);
        }}
        
        .bg-accent {{
            background-color: var(--color-accent);
        }}
        
        .rounded {{
            border-radius: var(--radius);
        }}
        
        .placeholder {{
            background-color: var(--color-muted);
            border: 2px dashed var(--color-border);
            border-radius: var(--radius);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--color-muted-foreground);
            font-style: italic;
            aspect-ratio: 4 / 3;
        }}
        
        h1 {{
            font-family: var(--font-family-display);
            font-weight: var(--font-weight-display);
            font-size: 2.5rem;
            margin: 0;
            line-height: 1.2;
        }}
        
        h2 {{
            font-family: var(--font-family-display);
            font-weight: var(--font-weight-display);
            font-size: 2rem;
            margin: 0;
            line-height: 1.3;
        }}
        
        h3 {{
            font-family: var(--font-family-display);
            font-weight: var(--font-weight-display);
            font-size: 1.5rem;
            margin: 0;
            line-height: 1.4;
        }}
        
        p {{
            font-size: var(--font-size-content);
            line-height: var(--line-height-content);
            margin: 0;
        }}
        
        ul {{
            margin: 0;
            padding-left: 1.5rem;
        }}
        
        li {{
            margin-bottom: 0.5rem;
        }}
        
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            background-color: var(--color-primary);
            color: var(--color-primary-foreground);
            border-radius: var(--radius-pill);
            font-size: 0.875rem;
            font-weight: 500;
        }}
        """
    
    def _create_slide_html(self, slide_data: Dict, config: PresentationConfig) -> str:
        """Create HTML content for a single slide."""
        slide_type = slide_data.get("type", "content")
        layout = slide_data.get("layout", "single_column")
        
        if slide_type == "title":
            return self._create_title_slide_html(slide_data)
        elif layout == "two_column":
            return self._create_two_column_slide_html(slide_data, config)
        elif layout == "three_column":
            return self._create_three_column_slide_html(slide_data, config)
        elif layout == "full_slide" and slide_data.get("chart_data"):
            return self._create_chart_slide_html(slide_data, config)
        else:
            return self._create_single_column_slide_html(slide_data)
    
    def _create_title_slide_html(self, slide_data: Dict) -> str:
        """Create title slide HTML."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{slide_data['title']}</title>
    <style>
        /* Shared CSS will be embedded here */
    </style>
</head>
<body class="col center">
    <h1>{slide_data['title']}</h1>
    <h2 class="text-muted-foreground">{slide_data.get('content', '')}</h2>
    <p class="text-muted-foreground">Presented by: Your Name</p>
</body>
</html>"""
    
    def _create_single_column_slide_html(self, slide_data: Dict) -> str:
        """Create single column slide HTML."""
        content = slide_data.get('content', '')
        # Convert content to HTML paragraphs
        paragraphs = [f"<p>{p.strip()}</p>" for p in content.split('\n') if p.strip()]
        content_html = '\n    '.join(paragraphs)
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{slide_data['title']}</title>
    <style>
        /* Shared CSS will be embedded here */
    </style>
</head>
<body class="col p-8">
    <h2 class="text-primary">{slide_data['title']}</h2>
    <div class="fill-height">
        {content_html}
    </div>
</body>
</html>"""
    
    def _create_two_column_slide_html(self, slide_data: Dict, config: PresentationConfig) -> str:
        """Create two column slide HTML."""
        content = slide_data.get('content', '')
        paragraphs = [f"<p>{p.strip()}</p>" for p in content.split('\n') if p.strip()]
        content_html = '\n        '.join(paragraphs)
        
        chart_placeholder = ""
        if slide_data.get("chart_data"):
            chart_placeholder = '<div class="placeholder fill-width">Chart Placeholder</div>'
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{slide_data['title']}</title>
    <style>
        /* Shared CSS will be embedded here */
    </style>
</head>
<body class="col p-8">
    <h2 class="text-primary text-center">{slide_data['title']}</h2>
    <div class="fill-height row gap-lg">
        <div class="fill-width">
            {content_html}
        </div>
        <div class="fill-width">
            {chart_placeholder}
        </div>
    </div>
</body>
</html>"""
    
    def _create_three_column_slide_html(self, slide_data: Dict, config: PresentationConfig) -> str:
        """Create three column slide HTML."""
        content = slide_data.get('content', '')
        # Split content into three parts
        content_parts = content.split('\n')
        part_size = len(content_parts) // 3
        
        columns = []
        for i in range(3):
            start_idx = i * part_size
            end_idx = start_idx + part_size if i < 2 else len(content_parts)
            part_content = '\n'.join(content_parts[start_idx:end_idx])
            paragraphs = [f"<p>{p.strip()}</p>" for p in part_content.split('\n') if p.strip()]
            columns.append('\n            '.join(paragraphs))
        
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{slide_data['title']}</title>
    <style>
        /* Shared CSS will be embedded here */
    </style>
</head>
<body class="col p-8">
    <h2 class="text-primary text-center">{slide_data['title']}</h2>
    <div class="fill-height row gap">
        <div class="fill-width">
            {columns[0]}
        </div>
        <div class="fill-width">
            {columns[1]}
        </div>
        <div class="fill-width">
            {columns[2]}
        </div>
    </div>
</body>
</html>"""
    
    def _create_chart_slide_html(self, slide_data: Dict, config: PresentationConfig) -> str:
        """Create slide with chart placeholder."""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{slide_data['title']}</title>
    <style>
        /* Shared CSS will be embedded here */
    </style>
</head>
<body class="col p-8">
    <h2 class="text-primary text-center">{slide_data['title']}</h2>
    <div class="fill-height">
        <div class="placeholder fill-width fill-height">
            {slide_data.get('chart_data', {}).get('title', 'Chart Placeholder')}
        </div>
    </div>
</body>
</html>"""
    
    def convert_to_powerpoint(self, html_files: List[str], output_path: str) -> bool:
        """Convert HTML slides to PowerPoint using html2pptx."""
        try:
            # Create JavaScript file for html2pptx conversion
            js_content = self._create_conversion_script(html_files, output_path)
            js_path = Path(self.temp_dir) / "convert.js"
            js_path.write_text(js_content)
            
            # Run the conversion
            result = subprocess.run([
                "node", str(js_path)
            ], capture_output=True, text=True, cwd=self.temp_dir)
            
            if result.returncode != 0:
                print(f"Conversion error: {result.stderr}")
                return False
            
            print(f"Presentation saved to: {output_path}")
            return True
            
        except Exception as e:
            print(f"Error converting to PowerPoint: {e}")
            return False
    
    def _create_conversion_script(self, html_files: List[str], output_path: str) -> str:
        """Create JavaScript file for html2pptx conversion."""
        html_imports = []
        slide_additions = []
        
        for i, html_file in enumerate(html_files):
            filename = Path(html_file).name
            html_imports.append(f'const slide{i+1} = "{filename}";')
            slide_additions.append(f'await html2pptx(slide{i+1}, pptx);')
        
        return f"""
const pptxgen = require("pptxgenjs");
const {{ html2pptx }} = require("@ant/html2pptx");

async function createPresentation() {{
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";
    pptx.author = "Gemini AI Presentation Generator";
    pptx.title = "AI Generated Presentation";
    
    {chr(10).join(html_imports)}
    
    {chr(10).join(slide_additions)}
    
    await pptx.writeFile("{output_path}");
    console.log("Presentation created successfully!");
}}

createPresentation().catch(console.error);
"""
    
    def cleanup(self):
        """Clean up temporary files."""
        if self.temp_dir and Path(self.temp_dir).exists():
            import shutil
            shutil.rmtree(self.temp_dir)


# Flask Web Application
app = Flask(__name__)
CORS(app)

# Store active generators to avoid recreating them
active_generators = {}

@app.route('/')
def index():
    """Serve the main web interface."""
    return render_template_string(HTML_TEMPLATE)

@app.route('/api/generate', methods=['POST'])
def generate_presentation():
    """API endpoint to generate presentations."""
    try:
        data = request.get_json()
        
        # Validate required fields (removed api_key from required fields)
        required_fields = ['topic', 'tone', 'target_audience', 'slide_count', 'color_palette']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Get API key from environment variable
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return jsonify({'error': 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.'}), 500
        
        # Create configuration
        config = PresentationConfig(
            topic=data['topic'],
            tone=data.get('tone', 'professional'),
            target_audience=data['target_audience'],
            slide_count=int(data['slide_count']),
            color_palette=data.get('color_palette', 'blue'),
            include_charts=data.get('include_charts', False),
            include_images=data.get('include_images', False)
        )
        
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        # Create generator using environment API key
        generator = GeminiPresentationGenerator(api_key)
        active_generators[session_id] = generator
        
        # Generate presentation outline
        print(f"Generating outline for topic: {config.topic}")
        outline = generator.generate_presentation_outline(config)
        if not outline:
            print("Failed to generate presentation outline - returning error")
            return jsonify({'error': 'Failed to generate presentation outline. Please check your API key and try again.'}), 500
        
        # Create HTML slides
        html_files = generator.create_html_slides(outline, config)
        
        return jsonify({
            'session_id': session_id,
            'outline': outline,
            'slide_count': len(html_files),
            'message': 'Presentation outline generated successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/convert/<session_id>', methods=['POST'])
def convert_presentation(session_id):
    """API endpoint to convert presentation to PowerPoint."""
    try:
        if session_id not in active_generators:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        generator = active_generators[session_id]
        
        # Get the outline from the request
        data = request.get_json()
        outline = data.get('outline')
        if not outline:
            return jsonify({'error': 'No outline provided'}), 400
        
        # Create HTML slides
        config = PresentationConfig(
            topic=outline.get('title', 'Presentation'),
            tone='professional',
            target_audience='General',
            slide_count=len(outline.get('slides', [])),
            color_palette='blue',
            include_charts=False,
            include_images=False
        )
        
        html_files = generator.create_html_slides(outline, config)
        
        # Generate output filename
        output_filename = f"{outline.get('title', 'presentation').replace(' ', '_').lower()}_presentation.pptx"
        output_path = os.path.join(tempfile.gettempdir(), output_filename)
        
        # Convert to PowerPoint
        success = generator.convert_to_powerpoint(html_files, output_path)
        
        if success:
            return jsonify({
                'success': True,
                'filename': output_filename,
                'download_url': f'/api/download/{session_id}/{output_filename}'
            })
        else:
            return jsonify({'error': 'Failed to convert presentation'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/<session_id>/<filename>')
def download_presentation(session_id, filename):
    """Download the generated PowerPoint file."""
    try:
        if session_id not in active_generators:
            return jsonify({'error': 'Invalid session ID'}), 400
        
        file_path = os.path.join(tempfile.gettempdir(), filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=True, download_name=filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cleanup/<session_id>', methods=['POST'])
def cleanup_session(session_id):
    """Clean up session resources."""
    try:
        if session_id in active_generators:
            active_generators[session_id].cleanup()
            del active_generators[session_id]
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# HTML Template for the web interface
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PowerPoint Generator with Gemini AI</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .outline {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            display: none;
        }
        .slide {
            margin-bottom: 15px;
            padding: 10px;
            background: white;
            border-left: 4px solid #007bff;
            border-radius: 3px;
        }
        .slide h4 {
            margin: 0 0 5px 0;
            color: #333;
        }
        .slide p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 PowerPoint Generator with Gemini AI</h1>
        <p style="text-align: center; color: #666; margin-bottom: 20px;">
            ✅ Gemini API key is configured and ready to use
        </p>
        
        <form id="presentationForm">
            <div class="form-group">
                <label for="topic">Presentation Topic:</label>
                <input type="text" id="topic" name="topic" required 
                       placeholder="e.g., Artificial Intelligence in Healthcare">
            </div>
            
            <div class="form-group">
                <label for="tone">Tone:</label>
                <select id="tone" name="tone">
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="technical">Technical</option>
                    <option value="creative">Creative</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="audience">Target Audience:</label>
                <input type="text" id="audience" name="audience" required 
                       placeholder="e.g., Business executives, Students, Developers">
            </div>
            
            <div class="form-group">
                <label for="slideCount">Number of Slides:</label>
                <input type="number" id="slideCount" name="slideCount" min="5" max="20" value="10">
            </div>
            
            <div class="form-group">
                <label for="colorPalette">Color Palette:</label>
                <select id="colorPalette" name="colorPalette">
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="red">Red</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="includeCharts" name="includeCharts"> Include Charts
                </label>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="includeImages" name="includeImages"> Include Image Placeholders
                </label>
            </div>
            
            <button type="submit" id="generateBtn">Generate Presentation</button>
            <button type="button" id="downloadBtn" style="display: none;">Download PowerPoint</button>
        </form>
        
        <div id="status" class="status"></div>
        <div id="outline" class="outline"></div>
    </div>

    <script>
        let currentSessionId = null;
        
        document.getElementById('presentationForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const generateBtn = document.getElementById('generateBtn');
            const status = document.getElementById('status');
            const outline = document.getElementById('outline');
            
            generateBtn.disabled = true;
            status.style.display = 'block';
            status.className = 'status';
            status.textContent = 'Generating presentation outline...';
            
            try {
                const formData = new FormData(e.target);
                const data = {
                    topic: formData.get('topic'),
                    tone: formData.get('tone'),
                    target_audience: formData.get('audience'),
                    slide_count: parseInt(formData.get('slideCount')),
                    color_palette: formData.get('colorPalette'),
                    include_charts: formData.has('includeCharts'),
                    include_images: formData.has('includeImages')
                };
                
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    currentSessionId = result.session_id;
                    status.className = 'status success';
                    status.textContent = `✅ Generated outline with ${result.slide_count} slides!`;
                    
                    // Display outline
                    outline.style.display = 'block';
                    outline.innerHTML = `
                        <h3>📋 Presentation Outline: ${result.outline.title}</h3>
                        <p><strong>Subtitle:</strong> ${result.outline.subtitle || 'N/A'}</p>
                        ${result.outline.slides.map(slide => `
                            <div class="slide">
                                <h4>Slide ${slide.slide_number}: ${slide.title}</h4>
                                <p>${slide.content}</p>
                            </div>
                        `).join('')}
                    `;
                    
                    // Store outline data for later use
                    outline.dataset.outline = JSON.stringify(result.outline);
                    
                    // Show download button
                    document.getElementById('downloadBtn').style.display = 'inline-block';
                } else {
                    status.className = 'status error';
                    status.textContent = `❌ Error: ${result.error}`;
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = `❌ Error: ${error.message}`;
            } finally {
                generateBtn.disabled = false;
            }
        });
        
        document.getElementById('downloadBtn').addEventListener('click', async function() {
            if (!currentSessionId) return;
            
            const status = document.getElementById('status');
            status.style.display = 'block';
            status.className = 'status';
            status.textContent = 'Converting to PowerPoint...';
            
            try {
                // First convert
                const convertResponse = await fetch(`/api/convert/${currentSessionId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        outline: JSON.parse(document.getElementById('outline').dataset.outline)
                    })
                });
                
                const convertResult = await convertResponse.json();
                
                if (convertResponse.ok) {
                    // Then download
                    window.location.href = convertResult.download_url;
                    status.className = 'status success';
                    status.textContent = '✅ PowerPoint file is being downloaded!';
                } else {
                    status.className = 'status error';
                    status.textContent = `❌ Error: ${convertResult.error}`;
                }
            } catch (error) {
                status.className = 'status error';
                status.textContent = `❌ Error: ${error.message}`;
            }
        });
    </script>
</body>
</html>
'''

def main():
    """Main application entry point for command line usage."""
    print("PowerPoint Presentation Generator using Gemini AI")
    print("=" * 50)
    
    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        api_key = input("Enter your Gemini API key: ").strip()
        if not api_key:
            print("Error: API key is required")
            return
    
    # Get presentation requirements
    print("\nPlease provide the following information:")
    topic = input("Presentation topic: ").strip()
    tone = input("Tone (professional, casual, technical, creative): ").strip() or "professional"
    audience = input("Target audience: ").strip()
    slide_count = int(input("Number of slides (5-20): ").strip() or "10")
    color_palette = input("Color palette (blue, green, purple, orange, red): ").strip() or "blue"
    include_charts = input("Include charts? (y/n): ").strip().lower() == 'y'
    include_images = input("Include image placeholders? (y/n): ").strip().lower() == 'y'
    
    # Create configuration
    config = PresentationConfig(
        topic=topic,
        tone=tone,
        target_audience=audience,
        slide_count=slide_count,
        color_palette=color_palette,
        include_charts=include_charts,
        include_images=include_images
    )
    
    # Generate presentation
    generator = GeminiPresentationGenerator(api_key)
    
    try:
        print("\nGenerating presentation outline...")
        outline = generator.generate_presentation_outline(config)
        if not outline:
            print("Failed to generate outline")
            return
        
        print(f"Generated outline with {len(outline['slides'])} slides")
        
        print("Creating HTML slides...")
        html_files = generator.create_html_slides(outline, config)
        print(f"Created {len(html_files)} HTML files")
        
        output_path = f"{topic.replace(' ', '_').lower()}_presentation.pptx"
        print("Converting to PowerPoint...")
        success = generator.convert_to_powerpoint(html_files, output_path)
        
        if success:
            print(f"\n✅ Presentation successfully created: {output_path}")
        else:
            print("\n❌ Failed to create presentation")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        generator.cleanup()


if __name__ == "__main__":
    # Check if running as web app or command line
    if len(sys.argv) > 1 and sys.argv[1] == '--web':
        print("Starting web server...")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        main()
