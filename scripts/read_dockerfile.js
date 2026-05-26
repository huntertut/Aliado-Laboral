const { Client } = require('ssh2'); 
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' }; 
(async () => { 
    const conn = new Client(); 
    conn.on('ready', () => { 
        conn.exec('cat /root/Aliado-Laboral/backend/Dockerfile', (err, stream) => { 
            if (err) throw err; 
            stream.on('data', d => process.stdout.write(d.toString())); 
            stream.on('close', () => conn.end()); 
        }); 
    }).connect(CONN); 
})()
