const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R', readyTimeout: 15000 };
const conn = new Client();

const scriptContent = `
cp /var/lib/containers/storage/overlay/1bcab69dc7436889fa4cf00da67429debf3f0130ee74699604ab9531cba99a6b/diff/app/dev.db /root/Aliado-Laboral/backend/recovered_apr15.db
sqlite3 /root/Aliado-Laboral/backend/recovered_apr15.db "SELECT count(*) FROM User;"
sqlite3 /root/Aliado-Laboral/backend/recovered_apr15.db "SELECT email FROM User ORDER BY createdAt DESC LIMIT 10;"
`;

conn.on('ready', async () => {
    const sftp = await new Promise((r,e) => conn.sftp((err,s) => err?e(err):r(s)));
    const fs = require('fs');
    fs.writeFileSync('temp_check_db.sh', scriptContent);
    await new Promise((r,e) => sftp.fastPut('temp_check_db.sh', '/root/temp_check_db.sh', err => err?e(err):r()));
    conn.exec('bash /root/temp_check_db.sh && rm /root/temp_check_db.sh', (err, stream) => {
        if (err) return console.error(err.message);
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => { fs.unlinkSync('temp_check_db.sh'); conn.end(); });
    });
}).on('error', err => console.error('SSH:', err.message)).connect(CONN);
