const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };
const REMOTE_ZIP_PATH = '/root/Aliado-Laboral/admin-web-dist.zip';
const REMOTE_DIST_PATH = '/root/Aliado-Laboral/admin-web/dist';
const LOCAL_ZIP_PATH = path.join(__dirname, '..', 'admin-web-dist.zip');

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
        process.stdout.write(`📤 Uploading admin-web-dist.zip... `);
        await sftpPut(sftp, LOCAL_ZIP_PATH, REMOTE_ZIP_PATH);
        console.log('✅');

        console.log('\n🔧 Unzipping on server...\n');
        await runCommand(conn, [
            `rm -rf ${REMOTE_DIST_PATH}/*`,
            `mkdir -p ${REMOTE_DIST_PATH}`,
            `unzip -o ${REMOTE_ZIP_PATH} -d ${REMOTE_DIST_PATH}`,
            `rm ${REMOTE_ZIP_PATH}`
        ].join(' && '));

        console.log('\n✅ Admin Web deployment complete!');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
    conn.end();
}).connect(CONN);
