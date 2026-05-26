const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R', readyTimeout: 15000 };
const conn = new Client();

const scriptContent = `
find / -name "dev.db" -type f 2>/dev/null | xargs stat -c "%y %n %s bytes" | sort -n | tail -20
find / -name "dev.db*" -type f 2>/dev/null | xargs stat -c "%y %n %s bytes" | sort -n | tail -20
`;

conn.on('ready', async () => {
    const sftp = await new Promise((r,e) => conn.sftp((err,s) => err?e(err):r(s)));
    const fs = require('fs');
    fs.writeFileSync('temp_find_db.sh', scriptContent);
    await new Promise((r,e) => sftp.fastPut('temp_find_db.sh', '/root/temp_find_db.sh', err => err?e(err):r()));
    conn.exec('bash /root/temp_find_db.sh && rm /root/temp_find_db.sh', (err, stream) => {
        if (err) return console.error(err.message);
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { fs.unlinkSync('temp_find_db.sh'); conn.end(); });
    });
}).on('error', err => console.error('SSH:', err.message)).connect(CONN);
