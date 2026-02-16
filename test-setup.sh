#!/bin/bash

# Docker GUI Test Setup Script
# This script creates test containers for testing the Docker GUI application

set -e

echo "======================================"
echo "Docker GUI - Test Environment Setup"
echo "======================================"
echo ""

# Check if Docker is running
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Clean up existing test containers
echo "2. Cleaning up existing test containers..."
docker rm -f test-nginx test-alpine test-postgres test-redis 2>/dev/null || true
echo "✅ Cleanup complete"
echo ""

# Create test containers
echo "3. Creating test containers..."

# Running container - Nginx web server
echo "   Creating test-nginx (running)..."
docker run -d \
  --name test-nginx \
  -p 8080:80 \
  -e TEST_ENV=production \
  -e APP_NAME=docker-gui-test \
  nginx:alpine

# Stopped container - Alpine
echo "   Creating test-alpine (stopped)..."
docker create \
  --name test-alpine \
  -e TEST_ENV=development \
  alpine:latest \
  sleep 3600

# Running container - PostgreSQL
echo "   Creating test-postgres (running)..."
docker run -d \
  --name test-postgres \
  -p 5433:5432 \
  -e POSTGRES_PASSWORD=testpassword \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_DB=testdb \
  -v postgres-test-data:/var/lib/postgresql/data \
  postgres:15-alpine

# Running container - Redis
echo "   Creating test-redis (running)..."
docker run -d \
  --name test-redis \
  -p 6380:6379 \
  redis:7-alpine

echo "✅ Test containers created"
echo ""

# Display container status
echo "4. Current container status:"
echo ""
docker ps -a --filter "name=test-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Test scenarios
echo "======================================"
echo "Test Scenarios Available"
echo "======================================"
echo ""
echo "Scenario 1: Basic Operations"
echo "  - test-nginx: Running container with ports"
echo "  - test-alpine: Stopped container"
echo ""
echo "Scenario 2: Stop/Start Testing"
echo "  Command: docker stop test-nginx"
echo "  Command: docker start test-nginx"
echo ""
echo "Scenario 3: Pause/Unpause Testing"
echo "  Command: docker pause test-nginx"
echo "  Command: docker unpause test-nginx"
echo ""
echo "Scenario 4: Remove Testing"
echo "  Command: docker rm test-alpine"
echo ""
echo "Scenario 5: Logs Testing"
echo "  test-nginx has HTTP logs (visit http://localhost:8080)"
echo "  test-postgres has database startup logs"
echo "  test-redis has Redis server logs"
echo ""
echo "Scenario 6: Details Testing"
echo "  test-nginx: Environment variables, port mappings"
echo "  test-postgres: Volume mounts, environment variables"
echo ""

# Container details
echo "======================================"
echo "Container Details"
echo "======================================"
echo ""
echo "test-nginx:"
echo "  URL: http://localhost:8080"
echo "  Ports: 8080:80"
echo "  Environment: TEST_ENV=production, APP_NAME=docker-gui-test"
echo ""
echo "test-postgres:"
echo "  Port: 5433:5432"
echo "  User: testuser"
echo "  Password: testpassword"
echo "  Database: testdb"
echo "  Volume: postgres-test-data"
echo ""
echo "test-redis:"
echo "  Port: 6380:6379"
echo ""
echo "test-alpine:"
echo "  Status: Created (stopped)"
echo ""

echo "======================================"
echo "Next Steps"
echo "======================================"
echo ""
echo "1. Install Rust (if not already installed):"
echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
echo ""
echo "2. Start the Docker GUI application:"
echo "   cd docker-gui"
echo "   npm run tauri:dev"
echo ""
echo "3. Run through test cases in TESTING.md"
echo ""
echo "4. Clean up test containers when done:"
echo "   ./test-cleanup.sh"
echo ""

echo "✅ Test environment ready!"
