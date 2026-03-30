const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const zipPath = path.join(__dirname, 'backend-patch3.zip');

console.log('Starting SSH connection to DigitalOcean...');

conn.on('ready', () => {
    console.log('[SSH] Connected to 142.93.186.75');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('[SFTP] Session initialized. Uploading backend-patch3.zip...');

        const readStream = fs.createReadStream(zipPath);
        const writeStream = sftp.createWriteStream('/root/Aliado-Laboral/backend-patch3.zip');

        writeStream.on('close', () => {
            console.log('[SFTP] Upload complete (100%). Initiating deployment commands...');

            // Execute the deployment script on the host
            const cmds = `
                set -e
                echo "[REMOTE] Extracting zip file..."
                cd /root/Aliado-Laboral
                unzip -o backend-patch3.zip -d backend/ || true
                
                echo "[REMOTE] Rebuilding Docker Containers..."
                cd backend
                docker-compose down
                docker-compose build --no-cache
                docker-compose up -d
                
                echo "[REMOTE] Pushing Prisma Schema to Database..."
                # Wait 5 seconds for the DB to be ready just in case
                sleep 5
                docker exec backend-backend-1 npx prisma db push
                
                echo "[REMOTE] DEPLOYMENT SUCCESSFUL!"
            `;

            conn.exec(cmds, (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log(`[SSH] Process closed with code ${code}`);
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data.toString());
                }).stderr.on('data', (data) => {
                    process.stderr.write(data.toString());
                });
            });
        });

        writeStream.on('error', (err) => {
            console.error('[SFTP] Error writing to remote file:', err);
            conn.end();
        });

        readStream.pipe(writeStream);
    });
}).on('error', (err) => {
    console.error('[SSH] Connection Error:', err);
}).connect({
    host: '142.93.186.75',
    port: 22,
    username: 'root',
    password: 'yA7%pA1{vD7_rR2R',
    readyTimeout: 60000
});
