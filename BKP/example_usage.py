#!/usr/bin/env python3
"""
Example usage of the PowerPoint Presentation Generator

This script demonstrates how to use the GeminiPresentationGenerator class
programmatically without the interactive command-line interface.
"""

import os
from app import GeminiPresentationGenerator, PresentationConfig


def example_business_presentation():
    """Example: Create a business presentation about digital transformation."""
    
    # Set your API key (or use environment variable)
    api_key = os.getenv("GEMINI_API_KEY", "your_api_key_here")
    
    # Create configuration
    config = PresentationConfig(
        topic="Digital Transformation in Healthcare",
        tone="professional",
        target_audience="healthcare executives and IT leaders",
        slide_count=8,
        color_palette="blue",
        include_charts=True,
        include_images=True
    )
    
    # Generate presentation
    generator = GeminiPresentationGenerator(api_key)
    
    try:
        print("Generating business presentation...")
        outline = generator.generate_presentation_outline(config)
        
        if outline:
            print(f"✅ Generated outline: {outline['title']}")
            print(f"📊 Slides: {len(outline['slides'])}")
            
            # Create HTML slides
            html_files = generator.create_html_slides(outline, config)
            print(f"📄 Created {len(html_files)} HTML files")
            
            # Convert to PowerPoint
            output_path = "digital_transformation_healthcare.pptx"
            success = generator.convert_to_powerpoint(html_files, output_path)
            
            if success:
                print(f"🎉 Presentation saved: {output_path}")
            else:
                print("❌ Conversion failed")
        else:
            print("❌ Failed to generate outline")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        generator.cleanup()


def example_creative_presentation():
    """Example: Create a creative presentation about design trends."""
    
    api_key = os.getenv("GEMINI_API_KEY", "your_api_key_here")
    
    config = PresentationConfig(
        topic="2024 Design Trends and Future Directions",
        tone="creative",
        target_audience="designers and creative professionals",
        slide_count=10,
        color_palette="purple",
        include_charts=False,
        include_images=True
    )
    
    generator = GeminiPresentationGenerator(api_key)
    
    try:
        print("Generating creative presentation...")
        outline = generator.generate_presentation_outline(config)
        
        if outline:
            print(f"✅ Generated outline: {outline['title']}")
            
            html_files = generator.create_html_slides(outline, config)
            output_path = "design_trends_2024.pptx"
            success = generator.convert_to_powerpoint(html_files, output_path)
            
            if success:
                print(f"🎨 Creative presentation saved: {output_path}")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        generator.cleanup()


def example_technical_presentation():
    """Example: Create a technical presentation about machine learning."""
    
    api_key = os.getenv("GEMINI_API_KEY", "your_api_key_here")
    
    config = PresentationConfig(
        topic="Machine Learning Algorithms for Data Scientists",
        tone="technical",
        target_audience="data scientists and ML engineers",
        slide_count=15,
        color_palette="green",
        include_charts=True,
        include_images=False
    )
    
    generator = GeminiPresentationGenerator(api_key)
    
    try:
        print("Generating technical presentation...")
        outline = generator.generate_presentation_outline(config)
        
        if outline:
            print(f"✅ Generated outline: {outline['title']}")
            
            html_files = generator.create_html_slides(outline, config)
            output_path = "ml_algorithms_data_scientists.pptx"
            success = generator.convert_to_powerpoint(html_files, output_path)
            
            if success:
                print(f"🔬 Technical presentation saved: {output_path}")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        generator.cleanup()


def example_casual_presentation():
    """Example: Create a casual presentation for a team meeting."""
    
    api_key = os.getenv("GEMINI_API_KEY", "your_api_key_here")
    
    config = PresentationConfig(
        topic="Q4 Team Performance and Goals for Next Quarter",
        tone="casual",
        target_audience="team members and managers",
        slide_count=6,
        color_palette="orange",
        include_charts=True,
        include_images=False
    )
    
    generator = GeminiPresentationGenerator(api_key)
    
    try:
        print("Generating casual presentation...")
        outline = generator.generate_presentation_outline(config)
        
        if outline:
            print(f"✅ Generated outline: {outline['title']}")
            
            html_files = generator.create_html_slides(outline, config)
            output_path = "q4_team_performance.pptx"
            success = generator.convert_to_powerpoint(html_files, output_path)
            
            if success:
                print(f"👥 Team presentation saved: {output_path}")
    
    except Exception as e:
        print(f"Error: {e}")
    finally:
        generator.cleanup()


if __name__ == "__main__":
    print("PowerPoint Presentation Generator - Examples")
    print("=" * 50)
    
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️  Please set your GEMINI_API_KEY environment variable")
        print("   export GEMINI_API_KEY='your_api_key_here'")
        print()
    
    print("Available examples:")
    print("1. Business presentation (Digital Transformation)")
    print("2. Creative presentation (Design Trends)")
    print("3. Technical presentation (Machine Learning)")
    print("4. Casual presentation (Team Performance)")
    print("5. Run all examples")
    
    choice = input("\nSelect an example (1-5): ").strip()
    
    if choice == "1":
        example_business_presentation()
    elif choice == "2":
        example_creative_presentation()
    elif choice == "3":
        example_technical_presentation()
    elif choice == "4":
        example_casual_presentation()
    elif choice == "5":
        print("Running all examples...")
        example_business_presentation()
        print()
        example_creative_presentation()
        print()
        example_technical_presentation()
        print()
        example_casual_presentation()
    else:
        print("Invalid choice. Please run the script again and select 1-5.")
