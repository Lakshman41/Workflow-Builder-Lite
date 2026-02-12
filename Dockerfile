# Build and run from project root: docker build -t workflow-builder-lite .
# Multi-stage: frontend build then backend + static

# Stage 1: Frontend (VITE_API_BASE empty = same-origin API in production)
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_BASE=
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# Stage 2: Backend + serve frontend static
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/alembic.ini ./
COPY backend/alembic/ ./alembic/
COPY backend/app/ ./app/
COPY --from=frontend /app/dist /app/static

ENV PORT=8080
ENV STATIC_DIR=/app/static

EXPOSE 8080

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
