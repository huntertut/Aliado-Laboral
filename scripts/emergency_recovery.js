/**
 * EMERGENCY RECOVERY SCRIPT
 * Aliado Laboral - Production Server Recovery
 * 
 * Problem: bcrypt native binary causes segfault on startup.
 * Fix: Upload updated source (bcryptjs), rebuild container on Node 20.
 */

const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const CONN = {
    host: '142.93.186.75',
    port: 22,
    username: 'root',
    password: 'yA7%pA1{vD7_rR2R',
    readyTimeout: 20000
};

// === DOCKERFILE - Node 20, no permission issues ===
const DOCKERFILE = `FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN node node_modules/prisma/build/index.js generate
RUN node node_modules/typescript/bin/tsc
EXPOSE 3001
CMD ["node", "dist/index.js"]
`;

// === DOCKER-COMPOSE - Clean, no log masking ===
const COMPOSE = `version: '3.8'
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
`;

async function runCmd(conn, cmd) {
    return new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let output = '';
            stream.on('data', d => { process.stdout.write(d.toString()); output += d.toString(); });
            stream.stderr.on('data', d => { process.stderr.write(d.toString()); output += d.toString(); });
            stream.on('close', () => resolve(output));
        });
    });
}

async function getSftp(conn) {
    return new Promise((res, rej) => conn.sftp((err, sftp) => err ? rej(err) : res(sftp)));
}

async function uploadFile(sftp, local, remote) {
    return new Promise((res, rej) => sftp.fastPut(local, remote, err => err ? rej(err) : res()));
}

async function main() {
    const conn = new Client();

    await new Promise((resolve, reject) => {
        conn.on('ready', resolve).on('error', reject).connect(CONN);
    });

    console.log('✅ SSH Connected to DigitalOcean\n');

    // Step 1: Upload the backend source tarball
    const tarPath = path.join(__dirname, '..', 'backend_update.tar.gz');
    if (!fs.existsSync(tarPath)) {
        throw new Error(`backend_update.tar.gz not found at ${tarPath}. Run: tar -czf backend_update.tar.gz --exclude=node_modules --exclude=dist -C backend .`);
    }

    console.log('📤 Uploading backend source tarball...');
    const sftp = await getSftp(conn);
    await uploadFile(sftp, tarPath, '/root/Aliado-Laboral/backend_update.tar.gz');
    console.log('✅ Upload complete.\n');

    // Step 2: Extract tarball, write updated Dockerfile and compose, then rebuild
    console.log('🔧 Extracting and rebuilding on server...\n');
    const rebuildScript = `
set -e
cd /root/Aliado-Laboral/backend

# Extract updated source
tar -xzf ../backend_update.tar.gz -C .
rm -f ../backend_update.tar.gz

# Write the fixed Dockerfile (Node 20)
cat > Dockerfile << 'DOCKERFILE_EOF'
${DOCKERFILE}
DOCKERFILE_EOF

# Write the clean docker-compose.yml
cat > docker-compose.yml << 'COMPOSE_EOF'
${COMPOSE}
COMPOSE_EOF

# Stop existing containers
echo "==> Stopping containers..."
docker-compose down 2>/dev/null || true

# Rebuild from scratch (no cache)
echo "==> Building new Docker image (Node 20 + bcryptjs)..."
docker-compose build --no-cache 2>&1

# Start
echo "==> Starting backend..."
docker-compose up -d 2>&1

# Wait for startup
sleep 5

# Check status
echo "==> Container status:"
docker-compose ps

# Health check
echo "==> Health check:"
curl -s http://localhost:3001/api/health || echo "Not ready yet (normal if startup is slow)"
`;

    await runCmd(conn, rebuildScript);

    console.log('\n✅ Recovery script complete!');
    conn.end();
}

main().catch(err => {
    console.error('\n❌ RECOVERY FAILED:', err.message);
    process.exit(1);
});
