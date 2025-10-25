# genis.ai - AI Presentation Generator
# Optimized Production Dockerfile for Railway deployment with layer caching
FROM node:18-bullseye

# ============================================================================
# STAGE 1: System Dependencies (rarely changes - cached longest)
# ============================================================================

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

# ============================================================================
# STAGE 2: Python Dependencies (changes occasionally)
# ============================================================================

# Install Python dependencies for skills
# This layer will only rebuild if Python packages change
RUN pip3 install --no-cache-dir \
    python-docx \
    openpyxl \
    reportlab \
    pypdf \
    pdfplumber \
    pandas \
    defusedxml

# ============================================================================
# STAGE 3: User Setup (do early for better caching)
# ============================================================================

# Create non-root user for security
# Doing this early means user creation layer is cached independent of code changes
RUN useradd -m -u 1001 appuser

# Set working directory and give ownership to appuser
WORKDIR /app
RUN chown appuser:appuser /app

# Create workspace directories early
RUN mkdir -p /app/workspace/generated \
    && mkdir -p /app/workspace/shared \
    && chmod -R 755 /app/workspace \
    && chown -R appuser:appuser /app/workspace

# ============================================================================
# STAGE 4: Node.js Dependencies (changes occasionally)
# ============================================================================

# Environment variables
# BASE_URL: Hardcoded to genis.ai for all shareable links
ENV BASE_URL="https://genis.ai"

# Copy ONLY package files first for better caching
# This layer will only rebuild if package.json or package-lock.json changes
COPY --chown=appuser:appuser package.json package-lock.json ./

# Install Node.js dependencies (production only)
# This layer is cached as long as package files don't change
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund

# ============================================================================
# STAGE 5: Skills Package (changes occasionally)
# ============================================================================

# Copy ONLY the html2pptx package for installation
# This minimizes cache invalidation
COPY --chown=appuser:appuser skills/pptx/html2pptx.tgz ./temp-html2pptx.tgz

# Install html2pptx from local .tgz file
RUN npm install ./temp-html2pptx.tgz --no-audit --no-fund && rm ./temp-html2pptx.tgz

# ============================================================================
# STAGE 6: Application Code (changes frequently - copied LAST)
# ============================================================================

# Copy application code AFTER all dependencies are installed
# Each folder is a separate layer for maximum cache efficiency
# Order: least frequently changed → most frequently changed
# Using --chown so files are owned by appuser from the start

# Config files (rarely change)
COPY --chown=appuser:appuser config/ ./config/

# Skills folder (rarely changes - mostly static)
COPY --chown=appuser:appuser skills/ ./skills/

# Server code (changes occasionally)
COPY --chown=appuser:appuser server/ ./server/

# Public frontend code (changes frequently)
COPY --chown=appuser:appuser public/ ./public/

# Main server file (changes occasionally)
COPY --chown=appuser:appuser server.js ./

# Switch to non-root user BEFORE installing Playwright
USER appuser

# ============================================================================
# STAGE 7: Playwright (install as appuser to fix permissions)
# ============================================================================

# Install Playwright browsers as appuser to avoid permission issues
# This ensures the cache directory is owned by appuser
RUN npx playwright install chromium --with-deps

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]