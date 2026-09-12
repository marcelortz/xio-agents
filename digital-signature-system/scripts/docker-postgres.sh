#!/bin/bash

# PostgreSQL Docker Setup Script
# Easy PostgreSQL deployment using Docker

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PostgreSQL Docker Setup                                   ║"
echo "║  XIO Governance System                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "📥 Install Docker from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker is installed"

# Container configuration
CONTAINER_NAME="xio-postgres"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="xio_governance"
POSTGRES_USER="xio_admin"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
VOLUME_NAME="xio-postgres-data"

echo ""
echo "📋 Configuration:"
echo "   Container Name: $CONTAINER_NAME"
echo "   Database: $POSTGRES_DB"
echo "   User: $POSTGRES_USER"
echo "   Port: $POSTGRES_PORT"
echo "   Volume: $VOLUME_NAME"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo ""
    echo "⚠️  Container '$CONTAINER_NAME' already exists"
    read -p "Do you want to remove and recreate it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 Stopping and removing existing container..."
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
    else
        echo "✅ Using existing container. Starting it..."
        docker start "$CONTAINER_NAME"
        echo "✅ PostgreSQL is running!"
        exit 0
    fi
fi

# Create volume if it doesn't exist
if ! docker volume ls --format '{{.Name}}' | grep -q "^${VOLUME_NAME}$"; then
    echo ""
    echo "📦 Creating Docker volume..."
    docker volume create "$VOLUME_NAME"
    echo "✅ Volume created: $VOLUME_NAME"
fi

# Start PostgreSQL container
echo ""
echo "🚀 Starting PostgreSQL container..."
docker run \
    --name "$CONTAINER_NAME" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -p "$POSTGRES_PORT:5432" \
    -v "$VOLUME_NAME:/var/lib/postgresql/data" \
    -d \
    postgres:15-alpine

echo "✅ Container started with ID: $(docker ps -q -f name=$CONTAINER_NAME)"

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
RETRIES=30
until docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; do
    if [ $RETRIES -eq 0 ]; then
        echo "❌ PostgreSQL failed to start"
        exit 1
    fi
    RETRIES=$((RETRIES - 1))
    echo -n "."
    sleep 1
done

echo ""
echo "✅ PostgreSQL is ready!"

# Display connection information
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  PostgreSQL Ready!                                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Connection Details:"
echo "   Host: localhost"
echo "   Port: $POSTGRES_PORT"
echo "   Database: $POSTGRES_DB"
echo "   User: $POSTGRES_USER"
echo "   Password: $POSTGRES_PASSWORD"
echo ""
echo "🔗 Connection String:"
echo "   postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$POSTGRES_PORT/$POSTGRES_DB"
echo ""
echo "📌 Useful Commands:"
echo "   # Connect to PostgreSQL"
echo "   docker exec -it $CONTAINER_NAME psql -U $POSTGRES_USER -d $POSTGRES_DB"
echo ""
echo "   # View logs"
echo "   docker logs $CONTAINER_NAME"
echo ""
echo "   # Stop container"
echo "   docker stop $CONTAINER_NAME"
echo ""
echo "   # Start container"
echo "   docker start $CONTAINER_NAME"
echo ""
echo "   # Remove container"
echo "   docker rm -f $CONTAINER_NAME"
echo ""
echo "✨ Setup complete! Continue with database migration..."
