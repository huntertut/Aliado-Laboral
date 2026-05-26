#!/bin/bash
# -----------------------------------------------------------------------------
# Aliado Laboral - Producution Cleanup & Stabilization Script
# -----------------------------------------------------------------------------
# This script resolves Error 500 issues caused by rogue PM2 processes or 
# Prisma schema mismatches on the host machine.
# -----------------------------------------------------------------------------

echo "🚀 Starting System Cleanup..."

# 1. Kill any rogue native PM2 processes (they hijack port 3001)
if command -v pm2 &> /dev/null; then
    echo "⚠️  Found PM2. Cleaning up native processes..."
    pm2 stop all
    pm2 delete all
    pm2 save --force
else
    echo "✅ No native PM2 found on host."
fi

# 2. Restart Docker environment
echo "🐳 Restarting Docker containers..."
cd /root/Aliado-Laboral/backend
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Synchronize Prisma inside the container
echo "🛠️  Updating Prisma Client inside container..."
docker exec -it backend-backend-1 npx prisma generate
docker exec -it backend-backend-1 npx prisma db push --accept-data-loss

# 4. Success message
echo "✨ System stabilized! Check logs with: docker logs -f backend-backend-1"
