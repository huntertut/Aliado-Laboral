const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };
const REMOTE_PATH = '/root/Aliado-Laboral/backend';

async function runCommand(conn, cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('close', (code) => res({ out, code }));
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; process.stderr.write(d); });
        });
    });
}

function getSftp(conn) {
    return new Promise((res, rej) => conn.sftp((err, sftp) => err ? rej(err) : res(sftp)));
}

async function uploadFile(sftp, local, remote) {
    return new Promise((res, rej) => sftp.fastPut(local, remote, (err) => err ? rej(err) : res()));
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected to DigitalOcean\n');
    try {
        const sftp = await getSftp(conn);

        console.log('📤 Uploading backend-update.zip...');
        await uploadFile(
            sftp, 
            path.join(__dirname, '..', 'backend-update.zip'), 
            `/root/Aliado-Laboral/backend-update.zip`
        );

        console.log('\n🧱 Extracting and Rebuilding Backend Docker Container...\n');
        const remoteCmd = `
            cd /root/Aliado-Laboral/backend &&
            rm -rf src scripts package.json package-lock.json tsconfig.json &&
            unzip -o ../backend-update.zip || true &&
            docker-compose down &&
            docker build --no-cache -t backend-backend:latest . &&
            docker-compose up -d
        `;
        const { code } = await runCommand(conn, remoteCmd);

        if (code === 0) {
            console.log('\n✅ Backend deployed successfully!');
        } else {
            console.error('\n❌ Deployment failed with code', code);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).connect(CONN);
