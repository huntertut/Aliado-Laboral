const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };
const conn = new Client();
conn.on('ready', () => {
    const cmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"email":"elmisamouse@hotmail.com", "password":"Veronica@2099"}' http://127.0.0.1:3001/api/auth/login`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => { conn.end(); }).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
    });
}).connect(CONN);
