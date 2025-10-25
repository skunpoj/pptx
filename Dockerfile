# AI Text2PPT Pro - Optimized Production Dockerfile
FROM node:18-bullseye

# Install LibreOffice for PDF conversion and Python for skills
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-impress \
    libreoffice-calc \
    fonts-liberation \
    fonts-noto \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy only production-essential files
COPY package.json package-lock.json ./
COPY server.js ./
COPY server/ ./server/
COPY public/ ./public/

# Copy skills folder structure (needed for skill manager)
COPY skills/ ./skills/

# Install Node.js dependencies (production only)
# Try npm ci first, fallback to npm install if it fails
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# Install html2pptx from local .tgz file
RUN npm install ./skills/pptx/html2pptx.tgz --no-audit --no-fund

# Install Python dependencies for skills
RUN pip3 install --no-cache-dir \
    python-docx \
    openpyxl \
    reportlab \
    pypdf \
    pdfplumber \
    pandas \
    defusedxml

# Install Playwright browsers (minimal)
RUN npx playwright install chromium --with-deps

# Create directories for file storage
RUN mkdir -p /app/workspace/generated \
    && mkdir -p /app/workspace/shared \
    && chmod -R 755 /app/workspace

# Create non-root user for security
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]