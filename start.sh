#!/bin/bash

# Validate .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file is missing. Please copy .env.template to .env and fill in the values."
  exit 1
fi

echo "Starting deployment using Docker Compose..."
docker compose up --build -d

echo "Checking service status..."
docker compose ps
echo "To view logs, use: docker compose logs -f"
