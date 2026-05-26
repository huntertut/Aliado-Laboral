#!/bin/bash
# ALIADO LABORAL - Native Host Rebuild & Recovery
# Root cause: Windows-compiled bcrypt binaries cause invalid ELF header on Linux
# Fix: Remove old node_modules, npm install natively on Linux, rebuild TypeScript, start with PM2
set -e

cd /root/Aliado-Laboral/backend

echo "==> [1/7] Stopping any PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 save --force 2>/dev/null || true

echo "==> [2/7] Stopping Docker containers..."
docker-compose down 2>/dev/null || true

echo "==> [3/7] Removing Windows node_modules (invalid ELF headers)..."
rm -rf node_modules
rm -f node npm npx 2>/dev/null || true  # remove legacy empty files

echo "==> [4/7] Installing fresh dependencies on Linux..."
npm install

echo "==> [5/7] Generating Prisma client..."
npx prisma generate

echo "==> [6/7] Compiling TypeScript..."
npx tsc

echo "==> [7/7] Starting backend with PM2..."
pm2 start dist/index.js --name aliado-api --update-env
pm2 save

echo "==> Waiting 5 seconds for startup..."
sleep 5

echo "==> Health check:"
curl -s http://localhost:3001/api/health

echo "==> PM2 status:"
pm2 list

echo "==> RECOVERY COMPLETE"
