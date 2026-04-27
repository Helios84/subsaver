FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port (Railway provides $PORT at runtime)
EXPOSE 8000

# Start: migrate → seed → serve
CMD alembic upgrade head && python scripts/seed_discounts.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
