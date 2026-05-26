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
        console.log("Checking elmisamouse in production DB...");
        
        const script = `
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function run() {
            const users = await prisma.user.findMany({
                where: { email: { contains: 'elmisamouse' } },
                include: { lawyerProfile: true, workerProfile: true }
            });
            console.log(JSON.stringify(users, null, 2));
        }
        run().catch(console.error).finally(() => prisma.$disconnect());
        `;
        
        await runCommand(conn, `cd /root/Aliado-Laboral/backend && cat << 'EOF' > check_user.js\n${script}\nEOF`);
        await runCommand(conn, `cd /root/Aliado-Laboral/backend && node check_user.js`);

    } catch (e) {
        console.error("Error:", e);
    }
    conn.end();
}).connect(CONN);
