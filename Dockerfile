FROM node:18-alpine

# Install required system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Set environment variables for Playwright
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install html2pptx and all dependencies globally
COPY skills/pptx/html2pptx.tgz /tmp/html2pptx.tgz
RUN npm install -g pptxgenjs jszip sharp playwright /tmp/html2pptx.tgz && \
    rm /tmp/html2pptx.tgz

# Install app dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js ./
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
