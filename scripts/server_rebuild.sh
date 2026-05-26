#!/bin/bash
# ALIADO LABORAL - EMERGENCY REBUILD SCRIPT
# Fixes: bcrypt segfault, missing libssl (Prisma), container crash
set -e

cd /root/Aliado-Laboral/backend

echo "==> Writing fixed Dockerfile (node:20 + openssl + bcryptjs)..."
cat > Dockerfile << 'EOF'
FROM node:20
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN node node_modules/prisma/build/index.js generate
RUN node node_modules/typescript/bin/tsc
EXPOSE 3001
CMD ["node", "dist/index.js"]
EOF

echo "==> Writing clean docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    build: .
    environment:
      - PORT=3001
      - DATABASE_URL=file:/app/dev.db
    env_file:
      - .env
    volumes:
      - ./dev.db:/app/dev.db
    restart: always
    network_mode: "host"
    command: node dist/index.js
EOF

echo "==> Stopping existing containers..."
docker-compose down 2>/dev/null || true

echo "==> Building new image (no cache)..."
docker-compose build --no-cache

echo "==> Starting backend..."
docker-compose up -d

echo "==> Waiting 8 seconds for startup..."
sleep 8

echo "==> Container status:"
docker-compose ps

echo "==> Local health check:"
curl -s http://localhost:3001/api/health || echo "STILL NOT READY - check logs"

echo "==> Recent logs:"
docker-compose logs --tail=20

echo "==> DONE"
