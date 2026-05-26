const { Client } = require('ssh2');
const CONN = { host: '142.93.186.75', port: 22, username: 'root', password: 'yA7%pA1{vD7_rR2R' };

// We execute this INSIDE the docker container to avoid host node_modules issues
const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const hash = "$2b$10$AbypXH7L56aCmHmGHL6qFenP6znZlH.z7bp9zMvDwqIB9Yw4neFyG";
    
    const emails = ["admin@test.com", "admin@cibertmx.org"];
    
    for (const email of emails) {
        console.log("Checking user: " + email);
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.update({
                where: { email },
                data: { passwordHash: hash, role: "admin" }
            });
            console.log("SUCCESS: Updated password/role for " + email);
        } else {
            // Create the admin if it doesn't exist (in case it was wiped)
            await prisma.user.create({
                data: {
                    email,
                    passwordHash: hash,
                    fullName: "Administrador Aliado",
                    role: "admin",
                    plan: "pro"
                }
            });
            console.log("SUCCESS: Created new admin user " + email);
        }
    }
    
    // FINAL CHECK
    const admins = await prisma.user.findMany({ where: { role: "admin" } });
    console.log("Current documented Admins in DB: " + JSON.stringify(admins.map(a => a.email)));
}

main()
    .catch(err => { console.log("INTERNAL SCRIPT ERROR: " + err.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
`;

async function start() {
    let retries = 5;
    while (retries > 0) {
        try {
            await new Promise((resolve, reject) => {
                const conn = new Client();
                conn.on('ready', () => {
                    console.log('✅ Connected to DigitalOcean');
                    const fullCmd = `
                        cat << 'EOF' > /tmp/fix_admin.js
${scriptContent}
EOF
                        docker cp /tmp/fix_admin.js backend-backend-1:/app/fix_admin.js
                        docker exec backend-backend-1 node fix_admin.js
                        docker exec backend-backend-1 rm fix_admin.js
                        rm /tmp/fix_admin.js
                    `;
                    conn.exec(fullCmd, (err, stream) => {
                        if (err) return reject(err);
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => {
                            console.log('\n✅ Maintenance complete.');
                            conn.end();
                            resolve();
                        });
                    });
                }).on('error', (err) => {
                    reject(err);
                }).connect({ ...CONN, readyTimeout: 20000 });
            });
            break; // Success
        } catch (err) {
            console.error(`⚠️ Connection failed (${err.message}). Retries left: ${retries - 1}`);
            retries--;
            if (retries === 0) throw err;
            await new Promise(r => setTimeout(r, 10000)); // Wait 10s
        }
    }
}

start().catch(console.error);
