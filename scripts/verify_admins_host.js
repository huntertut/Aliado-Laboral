const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to DigitalOcean');
    
    // Command to check users on host via sqlite3
    const cmd = "sqlite3 /root/Aliado-Laboral/backend/dev.db 'SELECT email, role FROM User WHERE role=\"admin\";'";

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', d => { output += d.toString(); });
        stream.stderr.on('data', d => { console.error('STDERR:', d.toString()); });
        stream.on('close', () => {
            console.log('\n--- Admin Users found in DB ---');
            console.log(output || 'No admins found via host sqlite.');
            console.log('-------------------------------');
            conn.end();
        });
    });
}).connect(CONN);
