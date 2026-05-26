const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

async function start() {
    const conn = new Client();
    conn.on('ready', () => {
        console.log('✅ Connected to DigitalOcean');
        
        // 1. Check container status
        // 2. Get last 50 lines of logs
        const cmd = "podman ps -a && echo '--- LOGS ---' && podman logs backend-backend-1 --tail 50";

        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => {
                conn.end();
            });
        });
    }).on('error', (err) => {
        console.error('❌ SSH Error:', err.message);
    }).connect({ ...CONN, readyTimeout: 20000 });
}

start().catch(console.error);
