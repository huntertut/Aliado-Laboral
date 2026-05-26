const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R', readyTimeout: 15000 };
const conn = new Client();

const d = new Date();
const timeStr = d.toISOString().replace('T', ' ').substring(0, 19);
const cmd = `date -u -s "${timeStr}" && date -u && systemctl restart pm2-root 2>/dev/null || pm2 restart aliado-api`;

conn.on('ready', () => {
    console.log('Connected. Running:', cmd);
    conn.exec(cmd, (err, stream) => {
        if (err) return console.error('exec error:', err.message);
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('SSH:', err.message)).connect(CONN);
