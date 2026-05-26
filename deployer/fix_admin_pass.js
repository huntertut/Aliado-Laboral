const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

const scriptContent = `
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
async function main() {
    const admins = await prisma.user.findMany({ where: { role: "admin" } });
    console.log("Found admins:", admins.map(a => a.email));

    const hash = await bcrypt.hash("Veronica@2099", 10);
    for (const admin of admins) {
        await prisma.user.update({
            where: { id: admin.id },
            data: { passwordHash: hash }
        });
        console.log("Updated password for admin:", admin.email);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /root/Aliado-Laboral/backend && cat << 'EOF' > fix_admin_pass.ts\n${scriptContent}\nEOF\nnpx ts-node fix_admin_pass.ts && rm fix_admin_pass.ts`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(CONN);
