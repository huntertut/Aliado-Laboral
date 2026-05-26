#!/bin/bash
# Restore admin credentials on the server
# Runs from within the backend directory using the native node_modules
cd /root/Aliado-Laboral/backend

HASH='$2b$10$AbypXH7L56aCmHmGHL6qFenP6znZlH.z7bp9zMvDwqIB9Yw4neFyG'

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const hash = '$2b\$10\$AbypXH7L56aCmHmGHL6qFenP6znZlH.z7bp9zMvDwqIB9Yw4neFyG';
    const emails = ['admin@test.com', 'admin@cibertmx.org'];
    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.user.update({ where: { email }, data: { passwordHash: hash, role: 'admin' } });
            console.log('UPDATED:', email);
        } else {
            await prisma.user.create({ data: { email, passwordHash: hash, fullName: 'Administrador Aliado', role: 'admin', plan: 'pro' } });
            console.log('CREATED:', email);
        }
    }
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    console.log('ALL ADMINS:', JSON.stringify(admins.map(a => a.email)));
}
main().catch(e => console.log('ERROR:', e.message)).finally(() => prisma.\$disconnect());
"
echo "Done."
