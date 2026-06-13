# Dev-oriented image (Phase 1): installs runtime + dev deps so the container
# can also run pytest/ruff. Phase 7 will split a lean production image.
FROM python:3.12-slim

# 12-factor: no .pyc, unbuffered stdout for logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# psycopg2-binary ships wheels, so no libpq build deps are needed.
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements-dev.txt

COPY . .

EXPOSE 8000

# Hot reload in dev; the source tree is bind-mounted by docker-compose.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
