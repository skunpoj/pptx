# 🎯 PowerPoint Generator with Gemini AI

A powerful web application that uses Google's Gemini AI to generate professional PowerPoint presentations. The app features a modern web interface and can be deployed using Docker.

## ✨ Features

- **AI-Powered Generation**: Uses Google's Gemini AI to create presentation content
- **Web Interface**: Modern, responsive web UI for easy use
- **Customizable Presentations**: Multiple color palettes, tones, and layouts
- **Chart Support**: Optional chart placeholders and data visualization
- **Docker Ready**: Complete containerization with Docker and Docker Compose
- **REST API**: Full API endpoints for integration
- **Session Management**: Secure session-based file handling

## 🚀 Quick Start

### Option 1: Docker (Recommended)

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd pptx
   ```

2. **Set your Gemini API key:**
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

3. **Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

4. **Access the web interface:**
   Open your browser to `http://localhost:5000`

### Option 2: Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   npm install
   npm run install-html2pptx
   ```

2. **Set your Gemini API key:**
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the web application:**
   ```bash
   python app.py --web
   ```

4. **Or run command-line version:**
   ```bash
   python app.py
   ```

## 🐳 Docker Deployment

### Using Dockerfile

```bash
# Build the image
docker build -t pptx-generator .

# Run the container
docker run -p 5000:5000 -e GEMINI_API_KEY=your_api_key_here pptx-generator
```

### Using Docker Compose

```bash
# Create .env file with your API key
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start the services
docker-compose up -d
```

## 🌐 Web Interface

The web application provides:

- **Form-based Input**: Easy-to-use form for presentation parameters
- **Real-time Generation**: Live preview of presentation outline
- **Download Support**: Direct download of generated PowerPoint files
- **Responsive Design**: Works on desktop and mobile devices

### Available Parameters

- **Topic**: Main presentation subject
- **Tone**: Professional, Casual, Technical, or Creative
- **Target Audience**: Who the presentation is for
- **Slide Count**: 5-20 slides
- **Color Palette**: Blue, Green, Purple, Orange, or Red
- **Charts**: Include chart placeholders
- **Images**: Include image placeholders

## 🔌 API Endpoints

### Generate Presentation Outline
```http
POST /api/generate
Content-Type: application/json

{
  "api_key": "your_gemini_api_key",
  "topic": "Artificial Intelligence in Healthcare",
  "tone": "professional",
  "target_audience": "Healthcare executives",
  "slide_count": 10,
  "color_palette": "blue",
  "include_charts": true,
  "include_images": false
}
```

### Convert to PowerPoint
```http
POST /api/convert/{session_id}
Content-Type: application/json

{
  "outline": { /* presentation outline object */ }
}
```

### Download PowerPoint File
```http
GET /api/download/{session_id}/{filename}
```

### Cleanup Session
```http
POST /api/cleanup/{session_id}
```

## 🛠️ Development

### Project Structure

```
pptx/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── start.sh             # Startup script
├── skill/               # html2pptx skill package
└── README.md            # This file
```

### Dependencies

**Python:**
- `google-generativeai>=0.8.0` - Gemini AI integration
- `Flask>=2.3.0` - Web framework
- `Flask-CORS>=4.0.0` - CORS support
- `python-pptx>=0.6.21` - PowerPoint manipulation

**Node.js:**
- `@ant/html2pptx` - HTML to PowerPoint conversion
- `pptxgenjs` - PowerPoint generation
- `playwright` - Browser automation

## 🔧 Configuration

### Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (required)
- `FLASK_ENV`: Flask environment (development/production)
- `FLASK_APP`: Flask application file

### Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Set the environment variable or use in the web interface

## 📝 Usage Examples

### Command Line
```bash
python app.py
# Follow the interactive prompts
```

### Web Interface
1. Open `http://localhost:5000`
2. Enter your Gemini API key
3. Fill in presentation details
4. Click "Generate Presentation"
5. Review the outline
6. Click "Download PowerPoint"

### API Integration
```python
import requests

# Generate presentation
response = requests.post('http://localhost:5000/api/generate', json={
    'api_key': 'your_api_key',
    'topic': 'Machine Learning Basics',
    'tone': 'technical',
    'target_audience': 'Data scientists',
    'slide_count': 12,
    'color_palette': 'purple',
    'include_charts': True
})

session_id = response.json()['session_id']

# Convert to PowerPoint
convert_response = requests.post(f'http://localhost:5000/api/convert/{session_id}', json={
    'outline': response.json()['outline']
})

# Download the file
download_url = convert_response.json()['download_url']
```

## 🐛 Troubleshooting

### Common Issues

1. **API Key Not Set**: Make sure `GEMINI_API_KEY` is properly set
2. **Port Already in Use**: Change the port in docker-compose.yml or use `-p 5001:5000`
3. **Node.js Dependencies**: Ensure html2pptx is properly installed
4. **Memory Issues**: Increase Docker memory limits if needed

### Logs

```bash
# View Docker logs
docker-compose logs -f

# View specific service logs
docker-compose logs pptx-generator
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub