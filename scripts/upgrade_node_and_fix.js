const { Client } = require('ssh2'); 
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' }; 

const DOCKERFILE = `# Use Node.js LTS
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Generate Prisma Client (using node directly to avoid permission issues)
RUN node node_modules/prisma/build/index.js generate

# Build the application (using node directly)
RUN node node_modules/typescript/bin/tsc

# Expose port
EXPOSE 3001

# Start command
CMD ["node", "dist/index.js"]
`;

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

async function start() {
    const conn = new Client();
    conn.on('ready', async () => {
        console.log('✅ Connected to DigitalOcean');
        
        // 1. Upload the tarball
        const sftp = await new Promise((res, rej) => conn.sftp((err, s) => err ? rej(err) : res(s)));
        const localTar = path.join(__dirname, '..', 'backend_update.tar.gz');
        console.log('📤 Uploading backend_update.tar.gz...');
        await new Promise((res, rej) => sftp.fastPut(localTar, '/root/Aliado-Laboral/backend_update.tar.gz', (err) => err ? rej(err) : res()));

        const fullCmd = `
            cd /root/Aliado-Laboral/backend
            tar -xzf ../backend_update.tar.gz -C .
            rm ../backend_update.tar.gz
            
            cat << 'EOF' > Dockerfile
${DOCKERFILE}
EOF
            cat << 'EOF' > docker-compose.yml
${COMPOSE}
EOF
            docker-compose down
            docker-compose build --no-cache
            docker-compose up -d
        `;

        conn.exec(fullCmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                console.log('\n✅ Deployment and Fix complete.');
                conn.end();
            });
        });
    }).connect(CONN);
}

start().catch(console.error);
