const { Client } = require('ssh2');

const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

const scriptContent = `
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();
async function main() {
    const hash = await bcrypt.hash("Veronica@2099", 10);
    const result = await prisma.user.updateMany({
        where: { email: "admin@cibertmx.org" },
        data: { passwordHash: hash }
    });
    console.log("Updated rows:", result.count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Updating password...');
    conn.exec(`cd /root/Aliado-Laboral/backend && cat << 'EOF' > update_pass.ts\n${scriptContent}\nEOF\nnpx ts-node update_pass.ts && rm update_pass.ts`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(CONN);
