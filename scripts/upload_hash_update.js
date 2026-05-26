const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R', readyTimeout: 15000 };
const conn = new Client();

const scriptContent = `
const b = require('bcryptjs');
const h = b.hashSync('Verónica@2099', 10);
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  await p.user.updateMany({ where: { role: 'admin' }, data: { passwordHash: h } });
  console.log('Admins updated with valid hash.');
}
main().catch(e=>console.log(e)).finally(() => p.$disconnect());
`;

conn.on('ready', async () => {
    const sftp = await new Promise((r,e) => conn.sftp((err,s) => err?e(err):r(s)));
    const fs = require('fs');
    fs.writeFileSync('temp_fix_auth.js', scriptContent);
    await new Promise((r,e) => sftp.fastPut('temp_fix_auth.js', '/root/Aliado-Laboral/backend/temp_fix_auth.js', err => err?e(err):r()));
    conn.exec('cd /root/Aliado-Laboral/backend && node temp_fix_auth.js && rm temp_fix_auth.js', (err, stream) => {
        if (err) return console.error(err.message);
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { fs.unlinkSync('temp_fix_auth.js'); conn.end(); });
    });
}).on('error', err => console.error('SSH:', err.message)).connect(CONN);
