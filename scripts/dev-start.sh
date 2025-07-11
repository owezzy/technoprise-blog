#!/bin/bash
set -e

echo "🚀 Starting Technoprise Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .envrc exists
if [ ! -f .envrc ]; then
    echo "❌ .envrc file not found. Please create it with your database configuration."
    exit 1
fi

# Source environment variables
source .envrc

echo "📦 Setting up database..."
make db/setup

echo "🔧 Building API..."
go build -o bin/api ./app/cmd/api

echo "✅ Development environment ready!"
echo ""
echo "Available commands:"
echo "  make run/api          - Start the API server"
echo "  make api/hot-reload   - Start with hot-reload (requires air)"
echo "  make db/psql          - Connect to database"
echo "  make db/docker/logs   - View database logs"
echo ""
echo "🌐 API will be available at: http://localhost:4000"
echo "🗄️  Database available at: localhost:5435"