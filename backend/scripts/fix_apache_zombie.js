const { Client } = require('ssh2');

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
        console.log("🛠️ EJECUTANDO FASE 3 DEL MANUAL: Matar Zombi y Reiniciar Apache...\n");

        console.log("1. Deteniendo Apache Nativo (CentOS)...");
        await runCommand(conn, "systemctl stop httpd");

        console.log("\n2. Asegurando que ningún proceso httpd pirata siga vivo...");
        await runCommand(conn, "killall -9 httpd || true");

        console.log("\n3. Iniciando Apache Oficial (CWP)...");
        await runCommand(conn, "/usr/local/apache/bin/apachectl start");

        console.log("\n4. Verificando procesos de Apache...");
        const ps = await runCommand(conn, "ps aux | grep httpd | grep -v grep");
        console.log("\nProcesos actuales:\n" + ps);

    } catch (e) {
        console.error("Error:", e);
    }
    conn.end();
}).connect(CONN);
