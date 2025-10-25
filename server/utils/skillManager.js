// Skill Manager - Handles different output formats (DOCX, PDF, XLSX)
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Skill Manager for handling different output formats
 */
class SkillManager {
    constructor() {
        this.skillsPath = path.join(__dirname, '../../skills');
        this.supportedFormats = ['pptx', 'docx', 'pdf', 'xlsx'];
    }

    /**
     * Get available skills and their capabilities
     */
    async getAvailableSkills() {
        const skills = {};
        
        for (const format of this.supportedFormats) {
            const skillPath = path.join(this.skillsPath, format);
            const skillInfo = await this.getSkillInfo(format, skillPath);
            skills[format] = skillInfo;
        }
        
        return skills;
    }

    /**
     * Get skill information and capabilities
     */
    async getSkillInfo(format, skillPath) {
        try {
            const skillInfo = {
                name: format.toUpperCase(),
                available: false,
                description: '',
                capabilities: [],
                requirements: []
            };

            // Check if skill directory exists
            try {
                await fs.access(skillPath);
                skillInfo.available = true;
            } catch (error) {
                return skillInfo;
            }

            // Read skill documentation
            const skillMdPath = path.join(skillPath, 'SKILL.md');
            try {
                const skillContent = await fs.readFile(skillMdPath, 'utf8');
                skillInfo.description = this.extractDescription(skillContent);
                skillInfo.capabilities = this.extractCapabilities(skillContent);
            } catch (error) {
                console.warn(`Could not read skill documentation for ${format}:`, error.message);
            }

            // Check for specific requirements
            skillInfo.requirements = await this.checkRequirements(format, skillPath);

            return skillInfo;
        } catch (error) {
            console.error(`Error getting skill info for ${format}:`, error);
            return {
                name: format.toUpperCase(),
                available: false,
                description: 'Error loading skill information',
                capabilities: [],
                requirements: []
            };
        }
    }

    /**
     * Extract description from skill documentation
     */
    extractDescription(content) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('description:')) {
                return lines[i].replace('description:', '').trim().replace(/"/g, '');
            }
        }
        return 'No description available';
    }

    /**
     * Extract capabilities from skill documentation
     */
    extractCapabilities(content) {
        const capabilities = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Creating') || lines[i].includes('Editing') || 
                lines[i].includes('Analysis') || lines[i].includes('Processing')) {
                capabilities.push(lines[i].trim());
            }
        }
        
        return capabilities.slice(0, 5); // Limit to 5 capabilities
    }

    /**
     * Check requirements for each skill
     */
    async checkRequirements(format, skillPath) {
        const requirements = [];

        try {
            // Check for Python requirements
            if (format !== 'pptx') {
                const requirementsPath = path.join(skillPath, 'requirements.txt');
                try {
                    await fs.access(requirementsPath);
                    requirements.push('Python dependencies available');
                } catch (error) {
                    requirements.push('Python dependencies needed');
                }
            }

            // Check for specific scripts
            const scriptsPath = path.join(skillPath, 'scripts');
            try {
                const scripts = await fs.readdir(scriptsPath);
                if (scripts.length > 0) {
                    requirements.push(`${scripts.length} processing scripts available`);
                }
            } catch (error) {
                requirements.push('Processing scripts needed');
            }

            // Check for specific format requirements
            switch (format) {
                case 'docx':
                    requirements.push('Python-docx library needed');
                    break;
                case 'pdf':
                    requirements.push('PyPDF2/pypdf library needed');
                    break;
                case 'xlsx':
                    requirements.push('openpyxl library needed');
                    break;
                case 'pptx':
                    requirements.push('html2pptx package available');
                    break;
            }

        } catch (error) {
            requirements.push('Requirements check failed');
        }

        return requirements;
    }

    /**
     * Process content for specific output format
     */
    async processContent(content, outputFormat, options = {}) {
        try {
            switch (outputFormat) {
                case 'pptx':
                    return await this.processPPTX(content, options);
                case 'docx':
                    return await this.processDOCX(content, options);
                case 'pdf':
                    return await this.processPDF(content, options);
                case 'xlsx':
                    return await this.processXLSX(content, options);
                default:
                    throw new Error(`Unsupported output format: ${outputFormat}`);
            }
        } catch (error) {
            console.error(`Error processing ${outputFormat}:`, error);
            throw new Error(`Failed to process ${outputFormat}: ${error.message}`);
        }
    }

    /**
     * Process content for PowerPoint (existing functionality)
     */
    async processPPTX(content, options) {
        // This uses the existing html2pptx functionality
        // The actual processing is handled by the main generation logic
        return {
            success: true,
            format: 'pptx',
            message: 'PowerPoint processing handled by existing html2pptx system'
        };
    }

    /**
     * Process content for Word document
     */
    async processDOCX(content, options) {
        try {
            // Check if Python and required libraries are available
            const pythonAvailable = await this.checkPythonAvailability();
            if (!pythonAvailable) {
                throw new Error('Python not available for DOCX processing');
            }

            // Create a temporary Python script for DOCX generation
            const scriptContent = this.generateDOCXScript(content, options);
            const scriptPath = path.join(__dirname, '../../workspace/generate_docx.py');
            
            await fs.writeFile(scriptPath, scriptContent);
            
            // Execute the Python script
            const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`);
            
            if (stderr) {
                console.warn('DOCX generation warnings:', stderr);
            }

            return {
                success: true,
                format: 'docx',
                message: 'Word document generated successfully',
                output: stdout
            };
        } catch (error) {
            throw new Error(`DOCX processing failed: ${error.message}`);
        }
    }

    /**
     * Process content for PDF
     */
    async processPDF(content, options) {
        try {
            const pythonAvailable = await this.checkPythonAvailability();
            if (!pythonAvailable) {
                throw new Error('Python not available for PDF processing');
            }

            const scriptContent = this.generatePDFScript(content, options);
            const scriptPath = path.join(__dirname, '../../workspace/generate_pdf.py');
            
            await fs.writeFile(scriptPath, scriptContent);
            
            const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`);
            
            if (stderr) {
                console.warn('PDF generation warnings:', stderr);
            }

            return {
                success: true,
                format: 'pdf',
                message: 'PDF document generated successfully',
                output: stdout
            };
        } catch (error) {
            throw new Error(`PDF processing failed: ${error.message}`);
        }
    }

    /**
     * Process content for Excel spreadsheet
     */
    async processXLSX(content, options) {
        try {
            const pythonAvailable = await this.checkPythonAvailability();
            if (!pythonAvailable) {
                throw new Error('Python not available for XLSX processing');
            }

            const scriptContent = this.generateXLSXScript(content, options);
            const scriptPath = path.join(__dirname, '../../workspace/generate_xlsx.py');
            
            await fs.writeFile(scriptPath, scriptContent);
            
            const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`);
            
            if (stderr) {
                console.warn('XLSX generation warnings:', stderr);
            }

            return {
                success: true,
                format: 'xlsx',
                message: 'Excel spreadsheet generated successfully',
                output: stdout
            };
        } catch (error) {
            throw new Error(`XLSX processing failed: ${error.message}`);
        }
    }

    /**
     * Check if Python is available
     */
    async checkPythonAvailability() {
        try {
            await execPromise('python3 --version');
            return true;
        } catch (error) {
            try {
                await execPromise('python --version');
                return true;
            } catch (error) {
                return false;
            }
        }
    }

    /**
     * Generate Python script for DOCX creation
     */
    generateDOCXScript(content, options) {
        return `
import sys
import os
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import json

def create_docx(content, options):
    # Create a new Document
    doc = Document()
    
    # Add title
    title = doc.add_heading('Generated Document', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Parse content and add sections
    sections = content.split('\\n\\n')
    
    for section in sections:
        if section.strip():
            # Add section heading
            heading = doc.add_heading(section.split('\\n')[0], level=1)
            
            # Add section content
            for line in section.split('\\n')[1:]:
                if line.strip():
                    doc.add_paragraph(line.strip())
            
            # Add spacing
            doc.add_paragraph()
    
    # Save document
    output_path = os.path.join(os.getcwd(), 'workspace', 'generated', 'document.docx')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    
    return output_path

if __name__ == "__main__":
    content = '''${content.replace(/'/g, "\\'")}'''
    options = ${JSON.stringify(options)}
    
    try:
        output_path = create_docx(content, options)
        print(json.dumps({"success": True, "output_path": output_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
`;
    }

    /**
     * Generate Python script for PDF creation
     */
    generatePDFScript(content, options) {
        return `
import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
import json

def create_pdf(content, options):
    # Create PDF document
    output_path = os.path.join(os.getcwd(), 'workspace', 'generated', 'document.pdf')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Create custom style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=30,
        alignment=1  # Center alignment
    )
    
    # Build content
    story = []
    
    # Add title
    title = Paragraph("Generated Document", title_style)
    story.append(title)
    story.append(Spacer(1, 12))
    
    # Parse content and add sections
    sections = content.split('\\n\\n')
    
    for section in sections:
        if section.strip():
            lines = section.split('\\n')
            if lines:
                # Add section heading
                heading = Paragraph(lines[0], styles['Heading2'])
                story.append(heading)
                story.append(Spacer(1, 6))
                
                # Add section content
                for line in lines[1:]:
                    if line.strip():
                        para = Paragraph(line.strip(), styles['Normal'])
                        story.append(para)
                        story.append(Spacer(1, 6))
    
    # Build PDF
    doc.build(story)
    return output_path

if __name__ == "__main__":
    content = '''${content.replace(/'/g, "\\'")}'''
    options = ${JSON.stringify(options)}
    
    try:
        output_path = create_pdf(content, options)
        print(json.dumps({"success": True, "output_path": output_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
`;
    }

    /**
     * Generate Python script for XLSX creation
     */
    generateXLSXScript(content, options) {
        return `
import sys
import os
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
import json

def create_xlsx(content, options):
    # Create a new workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Generated Spreadsheet"
    
    # Set up styles
    title_font = Font(bold=True, size=14)
    header_font = Font(bold=True)
    center_alignment = Alignment(horizontal='center')
    
    # Add title
    ws['A1'] = "Generated Spreadsheet"
    ws['A1'].font = title_font
    ws['A1'].alignment = center_alignment
    ws.merge_cells('A1:D1')
    
    # Parse content and add to spreadsheet
    sections = content.split('\\n\\n')
    row = 3
    
    for section in sections:
        if section.strip():
            lines = section.split('\\n')
            if lines:
                # Add section heading
                ws[f'A{row}'] = lines[0]
                ws[f'A{row}'].font = header_font
                row += 1
                
                # Add section content
                for line in lines[1:]:
                    if line.strip():
                        ws[f'A{row}'] = line.strip()
                        row += 1
                
                row += 1  # Add spacing between sections
    
    # Auto-adjust column width
    for column in ws.columns:
        max_length = 0
        column_letter = column[0].column_letter
        for cell in column:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 2, 50)
        ws.column_dimensions[column_letter].width = adjusted_width
    
    # Save workbook
    output_path = os.path.join(os.getcwd(), 'workspace', 'generated', 'document.xlsx')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    
    return output_path

if __name__ == "__main__":
    content = '''${content.replace(/'/g, "\\'")}'''
    options = ${JSON.stringify(options)}
    
    try:
        output_path = create_xlsx(content, options)
        print(json.dumps({"success": True, "output_path": output_path}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
`;
    }
}

module.exports = SkillManager;
