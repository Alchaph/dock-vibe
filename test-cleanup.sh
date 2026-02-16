#!/bin/bash

# Docker GUI Test Cleanup Script
# This script removes test containers created by test-setup.sh

set -e

echo "======================================"
echo "Docker GUI - Test Cleanup"
echo "======================================"
echo ""

echo "Removing test containers..."

# Stop and remove test containers
docker stop test-nginx test-postgres test-redis 2>/dev/null || true
docker rm -f test-nginx test-alpine test-postgres test-redis 2>/dev/null || true

echo "✅ Test containers removed"
echo ""

# Ask about volume cleanup
read -p "Do you want to remove test volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing test volumes..."
    docker volume rm postgres-test-data 2>/dev/null || true
    echo "✅ Test volumes removed"
else
    echo "⏭️  Test volumes kept"
fi

echo ""
echo "Cleanup complete!"
