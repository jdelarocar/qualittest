#!/bin/bash

# QUALITTEST System - Docker Startup Script

echo "🐳 Starting QUALITTEST System with Docker..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed!"
    echo "Please install Docker Compose and try again."
    exit 1
fi

echo "✓ Docker is running"
echo ""

# Stop existing containers if any
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null

echo ""
echo "🚀 Starting services..."
echo "   - MySQL Database"
echo "   - Backend API"
echo "   - Frontend App"
echo ""

# Start services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ QUALITTEST System is running!"
    echo ""
    echo "📍 Access URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:5001"
    echo "   MySQL:     localhost:3306"
    echo ""
    echo "👤 Login Credentials:"
    echo "   Username: admin"
    echo "   Password: admin123"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to start services"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
