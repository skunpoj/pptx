#!/usr/bin/env python3
"""
Demo script for the PowerPoint Presentation Generator

This script demonstrates the capabilities of the application
with pre-configured examples and showcases different features.
"""

import os
import json
from app import GeminiPresentationGenerator, PresentationConfig


def demo_color_palettes():
    """Demonstrate different color palettes."""
    print("🎨 Color Palette Demo")
    print("=" * 30)
    
    palettes = ["blue", "green", "purple", "orange", "red"]
    
    for palette in palettes:
        print(f"\nCreating sample slide with {palette} palette...")
        
        config = PresentationConfig(
            topic=f"Sample {palette.title()} Theme",
            tone="professional",
            target_audience="demo audience",
            slide_count=1,
            color_palette=palette,
            include_charts=False,
            include_images=False
        )
        
        generator = GeminiPresentationGenerator("demo_key")
        
        # Create a simple slide HTML
        slide_data = {
            "slide_number": 1,
            "type": "content",
            "title": f"{palette.title()} Theme Demo",
            "content": f"This slide demonstrates the {palette} color palette with professional styling.",
            "layout": "single_column"
        }
        
        html_content = generator._create_single_column_slide_html(slide_data)
        
        # Save demo file
        demo_file = f"demo_{palette}_theme.html"
        with open(demo_file, 'w') as f:
            f.write(html_content)
        
        print(f"✅ Created: {demo_file}")
    
    print(f"\n📁 Created {len(palettes)} demo HTML files")
    print("Open them in a browser to see the different color themes!")


def demo_slide_layouts():
    """Demonstrate different slide layouts."""
    print("\n📐 Slide Layout Demo")
    print("=" * 30)
    
    layouts = [
        ("title", "Title Slide Layout"),
        ("single_column", "Single Column Layout"),
        ("two_column", "Two Column Layout"),
        ("three_column", "Three Column Layout"),
        ("full_slide", "Full Slide with Chart")
    ]
    
    config = PresentationConfig(
        topic="Layout Demonstration",
        tone="professional",
        target_audience="designers",
        slide_count=1,
        color_palette="blue",
        include_charts=True,
        include_images=False
    )
    
    generator = GeminiPresentationGenerator("demo_key")
    
    for i, (layout_type, description) in enumerate(layouts, 1):
        print(f"\nCreating {description}...")
        
        slide_data = {
            "slide_number": i,
            "type": "content" if layout_type != "title" else "title",
            "title": f"Slide {i}: {description}",
            "content": f"This demonstrates the {layout_type} layout with sample content that shows how text and elements are arranged.",
            "layout": layout_type,
            "chart_data": {"type": "bar", "title": "Sample Chart"} if layout_type == "full_slide" else None
        }
        
        if layout_type == "title":
            html_content = generator._create_title_slide_html(slide_data)
        elif layout_type == "two_column":
            html_content = generator._create_two_column_slide_html(slide_data, config)
        elif layout_type == "three_column":
            html_content = generator._create_three_column_slide_html(slide_data, config)
        elif layout_type == "full_slide":
            html_content = generator._create_chart_slide_html(slide_data, config)
        else:
            html_content = generator._create_single_column_slide_html(slide_data)
        
        demo_file = f"demo_layout_{layout_type}.html"
        with open(demo_file, 'w') as f:
            f.write(html_content)
        
        print(f"✅ Created: {demo_file}")
    
    print(f"\n📁 Created {len(layouts)} layout demo files")


def demo_content_generation():
    """Demonstrate AI content generation capabilities."""
    print("\n🤖 AI Content Generation Demo")
    print("=" * 40)
    
    # This would normally use a real API key
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("⚠️  No Gemini API key found. Skipping AI demo.")
        print("   Set GEMINI_API_KEY environment variable to see AI content generation.")
        return
    
    topics = [
        "The Future of Remote Work",
        "Sustainable Energy Solutions",
        "Artificial Intelligence in Healthcare",
        "Digital Marketing Trends 2024"
    ]
    
    generator = GeminiPresentationGenerator(api_key)
    
    for topic in topics:
        print(f"\nGenerating content for: {topic}")
        
        config = PresentationConfig(
            topic=topic,
            tone="professional",
            target_audience="business professionals",
            slide_count=3,
            color_palette="blue",
            include_charts=True,
            include_images=False
        )
        
        try:
            outline = generator.generate_presentation_outline(config)
            if outline:
                print(f"✅ Generated: {outline['title']}")
                print(f"   Slides: {len(outline['slides'])}")
                
                # Show first slide content
                first_slide = outline['slides'][0]
                print(f"   First slide: {first_slide['title']}")
                print(f"   Content preview: {first_slide['content'][:100]}...")
            else:
                print("❌ Failed to generate content")
        
        except Exception as e:
            print(f"❌ Error: {e}")
    
    generator.cleanup()


def demo_powerpoint_conversion():
    """Demonstrate PowerPoint conversion process."""
    print("\n📊 PowerPoint Conversion Demo")
    print("=" * 35)
    
    # Create a simple presentation outline
    outline = {
        "title": "Demo Presentation",
        "subtitle": "PowerPoint Conversion Test",
        "slides": [
            {
                "slide_number": 1,
                "type": "title",
                "title": "Demo Presentation",
                "content": "PowerPoint Conversion Test",
                "layout": "title_slide"
            },
            {
                "slide_number": 2,
                "type": "content",
                "title": "Features Demo",
                "content": "This presentation demonstrates the conversion from HTML to PowerPoint format using the html2pptx library.",
                "layout": "single_column"
            },
            {
                "slide_number": 3,
                "type": "content",
                "title": "Chart Example",
                "content": "This slide includes a chart placeholder for data visualization.",
                "layout": "two_column",
                "chart_data": {
                    "type": "bar",
                    "title": "Sample Data",
                    "data": [
                        {"label": "Q1", "value": 100},
                        {"label": "Q2", "value": 150},
                        {"label": "Q3", "value": 200}
                    ]
                }
            }
        ]
    }
    
    config = PresentationConfig(
        topic="Demo Presentation",
        tone="professional",
        target_audience="demo",
        slide_count=3,
        color_palette="blue",
        include_charts=True,
        include_images=False
    )
    
    generator = GeminiPresentationGenerator("demo_key")
    
    try:
        print("Creating HTML slides...")
        html_files = generator.create_html_slides(outline, config)
        print(f"✅ Created {len(html_files)} HTML files")
        
        print("Converting to PowerPoint...")
        success = generator.convert_to_powerpoint(html_files, "demo_presentation.pptx")
        
        if success:
            print("✅ PowerPoint conversion successful!")
            print("📁 Output file: demo_presentation.pptx")
        else:
            print("❌ PowerPoint conversion failed")
            print("   Make sure html2pptx is installed: npm install -g ./skill/html2pptx.tgz")
    
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
    finally:
        generator.cleanup()


def main():
    """Run all demos."""
    print("PowerPoint Presentation Generator - Demo")
    print("=" * 50)
    print("This demo showcases the capabilities of the application.")
    print()
    
    # Run demos
    demo_color_palettes()
    demo_slide_layouts()
    demo_content_generation()
    demo_powerpoint_conversion()
    
    print("\n🎉 Demo completed!")
    print("\nGenerated files:")
    print("- demo_*_theme.html (color palette demos)")
    print("- demo_layout_*.html (layout demos)")
    print("- demo_presentation.pptx (PowerPoint conversion demo)")
    print("\nOpen the HTML files in a browser to see the visual results!")


if __name__ == "__main__":
    main()
