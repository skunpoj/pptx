FROM node:18-bullseye-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    libpixman-1-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install html2pptx and all dependencies globally
COPY skills/pptx/html2pptx.tgz /tmp/html2pptx.tgz
RUN npm install -g pptxgenjs jszip sharp playwright /tmp/html2pptx.tgz && \
    rm /tmp/html2pptx.tgz

# Install Playwright Chromium browser
RUN npx playwright install --with-deps chromium

# Install app dependencies
# Use npm install instead of ci since lock file may be out of sync
RUN npm install --only=production

# Copy application files
COPY server.js ./
COPY server ./server
COPY config ./config
COPY public ./public

# Create workspace directory
RUN mkdir -p workspace

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the application
CMD ["node", "server.js"]
