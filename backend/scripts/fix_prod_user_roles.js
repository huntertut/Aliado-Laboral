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
        console.log("Fixing mismatched UserRoles in production DB...");
        
        const script = `
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        async function run() {
            const userRoles = await prisma.userRole.findMany({
                include: { user: true }
            });
            let fixed = 0;
            for (const ur of userRoles) {
                if (ur.user && ur.role !== ur.user.role) {
                    console.log(\`Mismatched role for \${ur.email}: UserRole.role=\${ur.role}, User.role=\${ur.user.role}\`);
                    await prisma.userRole.update({
                        where: { id: ur.id },
                        data: { role: ur.user.role }
                    });
                    fixed++;
                }
            }
            console.log(\`Fixed \${fixed} mismatched UserRole records.\`);
        }
        run().catch(console.error).finally(() => prisma.$disconnect());
        `;
        
        await runCommand(conn, `cd /root/Aliado-Laboral/backend && cat << 'EOF' > fix_user_roles.js\n${script}\nEOF`);
        await runCommand(conn, `cd /root/Aliado-Laboral/backend && node fix_user_roles.js`);

    } catch (e) {
        console.error("Error:", e);
    }
    conn.end();
}).connect(CONN);
