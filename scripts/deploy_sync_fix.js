const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };
const REMOTE_PATH = '/root/Aliado-Laboral/backend';
const SCRIPT_PATH = path.join(__dirname, '..', 'documentation', 'scripts', 'clean_production.sh');

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

        // 1. Upload the stabilization script
        console.log('📤 Uploading clean_production.sh...');
        await uploadFile(sftp, SCRIPT_PATH, '/root/clean_production.sh');

        // 2. Upload critical backend files (for build)
        // Note: For a full fix, we'd ideally zip everything, but we can start by ensuring 
        // the modified files are up. However, the script builds on server.
        // Let's upload the modified files directly to their respective paths.
        console.log('📤 Updating backend controller and routes...');
        await uploadFile(sftp, path.join(__dirname, '..', 'backend', 'src', 'controllers', 'adminController.ts'), `${REMOTE_PATH}/src/controllers/adminController.ts`);
        await uploadFile(sftp, path.join(__dirname, '..', 'backend', 'src', 'routes', 'adminRoutes.ts'), `${REMOTE_PATH}/src/routes/adminRoutes.ts`);

        // 3. Make script executable and run it
        console.log('\n🧱 Running System Stabilization...\n');
        const { code } = await runCommand(conn, 'chmod +x /root/clean_production.sh && bash /root/clean_production.sh');

        if (code === 0) {
            console.log('\n✨ System stabilized. Triggering sync...');
            // 4. Trigger the universal sync endpoint (admin required, but we can call it locally if we skip auth or just use curl)
            // Since we are root on the server, we can try to call the internal port 3001 directly to skip some proxy auth if needed, 
            // OR use the actual external URL if we have an admin token.
            // Let's just try to call it internally:
            await runCommand(conn, 'curl -X POST http://localhost:3001/api/admin/users/sync-firebase');
            console.log('\n✅ Sync triggered!');
        } else {
            console.error('\n❌ Stabilization script failed with code', code);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).connect(CONN);
