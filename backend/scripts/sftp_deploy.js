const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

const conn = new Client();
conn.on('ready', () => {
    console.log('Client :: ready');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localFile = path.join(__dirname, '..', 'src', 'controllers', 'firebaseAuthController.ts');
        const remoteFile = '/root/Aliado-Laboral/backend/src/controllers/firebaseAuthController.ts';
        
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('Successfully uploaded file!');
            
            conn.exec('cd /root/Aliado-Laboral/backend && npx tsc && pm2 restart api', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code) => {
                    console.log('Compilation and Restart done with code', code);
                    conn.end();
                }).on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d));
            });
        });
    });
}).connect(CONN);
