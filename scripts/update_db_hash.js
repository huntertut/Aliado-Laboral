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
main().finally(() => p.$disconnect());
`;

conn.on('ready', () => {
    conn.exec(`cd /root/Aliado-Laboral/backend && echo "${scriptContent.replace(/\$/g, '\\$').replace(/"/g, '\\"').replace(/\n/g, '\\n')}" > fix_auth.js && node fix_auth.js && rm fix_auth.js`, (err, stream) => {
        if (err) return console.error(err.message);
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('SSH:', err.message)).connect(CONN);
