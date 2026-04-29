if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file is missing. Please copy .env.template to .env and fill in the values." -ForegroundColor Red
    exit 1
}

Write-Host "Starting deployment using Docker Compose..." -ForegroundColor Green
docker compose up --build -d

Write-Host "Checking service status..." -ForegroundColor Yellow
docker compose ps
Write-Host "To view logs, use: docker compose logs -f" -ForegroundColor Cyan
