const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };
const REMOTE_BASE = '/root/Aliado-Laboral/backend';

const LOCAL_BASE = path.join(__dirname, '..');

const files = [
    { local: path.join(LOCAL_BASE, 'backend', 'src', 'controllers', 'contactController.ts'), remote: `${REMOTE_BASE}/src/controllers/contactController.ts` },
    { local: path.join(LOCAL_BASE, 'backend', 'src', 'controllers', 'adminController.ts'),   remote: `${REMOTE_BASE}/src/controllers/adminController.ts` },
    { local: path.join(LOCAL_BASE, 'backend', 'src', 'routes', 'adminRoutes.ts'),             remote: `${REMOTE_BASE}/src/routes/adminRoutes.ts` },
    { local: path.join(LOCAL_BASE, 'backend', 'prisma', 'schema.prisma'),                     remote: `${REMOTE_BASE}/prisma/schema.prisma` },
];

function sftpPut(sftp, localPath, remotePath) {
    return new Promise((res, rej) => {
        sftp.fastPut(localPath, remotePath, (err) => err ? rej(err) : res());
    });
}

async function runCommand(conn, cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('close', () => res(out));
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; process.stderr.write(d); });
        });
    });
}

function getSftp(conn) {
    return new Promise((res, rej) => conn.sftp((err, sftp) => err ? rej(err) : res(sftp)));
}

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ Connected to DigitalOcean\n');
    try {
        const sftp = await getSftp(conn);
        for (const f of files) {
            process.stdout.write(`📤 Uploading ${path.basename(f.local)}... `);
            await sftpPut(sftp, f.local, f.remote);
            console.log('✅');
        }

        console.log('\n🔧 Running build + pm2 restart...\n');
        await runCommand(conn, [
            `cd ${REMOTE_BASE}`,
            'npm run build',
            'pm2 restart aliado-api'
        ].join(' && '));

        console.log('\n✅ Phase 29 deployment complete!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).connect(CONN);
