# ==============================================================================
# ResearchRAG Frontend Dockerfile
# Stage 1: Build static assets using Node 20 Alpine
# Stage 2: Serve optimized assets with Nginx Alpine
# ==============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package manifests
COPY package*.json ./

# Install project dependencies
RUN npm ci || npm install

# Copy source code and config files
COPY . .

# Build production bundle with Vite
RUN npm run build

# --- Stage 2: Production Web Server ---
FROM nginx:1.25-alpine

WORKDIR /usr/share/nginx/html

# Clean default Nginx website files
RUN rm -rf ./*

# Copy built distribution from builder stage
COPY --from=builder /app/dist .

# Create inline Nginx configuration with SPA fallback and API reverse proxy
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
\n\
    # Gzip compression settings\n\
    gzip on;\n\
    gzip_vary on;\n\
    gzip_min_length 1024;\n\
    gzip_proxied expired no-cache no-store private auth;\n\
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;\n\
    gzip_disable "MSIE [1-6]\\.";\n\
\n\
    # Serve static assets and handle client-side routing fallback\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
\n\
    # Cache static assets\n\
    location ~* \\.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {\n\
        expires 6M;\n\
        access_log off;\n\
        add_header Cache-Control "public, max-age=15552000, immutable";\n\
    }\n\
\n\
    # Reverse proxy API requests to backend service\n\
    location /api/ {\n\
        proxy_pass http://backend:8000;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $http_host;\n\
        proxy_cache_bypass $http_upgrade;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
        proxy_read_timeout 300;\n\
        proxy_connect_timeout 300;\n\
    }\n\
\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
