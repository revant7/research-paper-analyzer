# ==============================================================================
# ResearchRAG Backend Dockerfile
# Python 3.11 slim base image with PDF processing & database utilities
# ==============================================================================

FROM python:3.11-slim

# Set environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=8000

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    curl \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Create storage directory for uploaded papers
RUN mkdir -p /app/uploads /app/logs

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose backend API port
EXPOSE 8000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Start FastAPI application via Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
