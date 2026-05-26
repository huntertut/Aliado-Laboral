const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

function runCommand(conn, cmd) {
    return new Promise((res, rej) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return rej(err);
            let out = '';
            stream.on('close', () => res(out));
            stream.on('data', d => { out += d; process.stdout.write(d); });
            stream.stderr.on('data', d => { out += d; process.stderr.write(d); });
        });
    });
}

const conn = new Client();
conn.on('ready', async () => {
    try {
        console.log("Uploading fixed firebaseAuthController.ts to production...");
        
        const content = fs.readFileSync(path.join(__dirname, '..', 'src', 'controllers', 'firebaseAuthController.ts'), 'utf8');
        
        // Escape backticks and dollars for shell heredoc
        const safeContent = content.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
        
        const cmd = `cat << 'EOF' > /root/Aliado-Laboral/backend/src/controllers/firebaseAuthController.ts\n${safeContent}\nEOF`;
        await runCommand(conn, cmd);
        
        console.log("Recompiling backend...");
        await runCommand(conn, `cd /root/Aliado-Laboral/backend && npx tsc`);
        
        console.log("Restarting backend PM2...");
        await runCommand(conn, `pm2 restart api || pm2 restart all`);
        
        console.log("Done!");
    } catch (e) {
        console.error("Error:", e);
    }
    conn.end();
}).connect(CONN);
