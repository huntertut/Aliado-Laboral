import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔥 Seeding UserRole mappings for Firebase users...');

    const userRoles = [
        {
            firebaseUid: 'Y4ySax5hWYd6dh1lXOkDskeQwNB2', // worker_std@test.com
            email: 'worker_std@test.com',
            role: 'worker',
            fullName: 'Trabajador Estándar'
        },
        {
            firebaseUid: 'PwugREpGo5cVDERLgk9D1dxu4f02', // worker_pro@test.com
            email: 'worker_pro@test.com',
            role: 'worker',
            fullName: 'Trabajador Pro'
        },
        {
            firebaseUid: 'oESboUThn8Zp7URzysPCG861Ajh1', // lawyer_pro1@test.com
            email: 'lawyer_pro1@test.com',
            role: 'lawyer',
            fullName: 'Abogado Pro 1'
        },
        {
            firebaseUid: 'vvEv7RzoXccusQTNndoAiiDYevJ2', // lawyer_pro2@test.com
            email: 'lawyer_pro2@test.com',
            role: 'lawyer',
            fullName: 'Abogado Pro 2'
        },
        {
            firebaseUid: 'TjPDy7Lyf9MVLIu7e30DOzMysSf1', // admin@test.com
            email: 'admin@test.com',
            role: 'admin',
            fullName: 'Administrador'
        }
    ];

    for (const roleData of userRoles) {
        const existing = await prisma.userRole.findUnique({
            where: { firebaseUid: roleData.firebaseUid }
        });

        if (existing) {
            console.log(`✅ ${roleData.email} ya existe`);
        } else {
            await prisma.userRole.create({ data: roleData });
            console.log(`✨ Creado: ${roleData.email} (${roleData.role})`);
        }
    }

    console.log('✅ Seeding completado');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
