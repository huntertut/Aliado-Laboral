import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emails = process.argv.slice(2);

if (emails.length === 0) {
    console.log('Error: Por favor proporciona al menos un correo electrónico.');
    console.log('Uso: npx ts-node promoteLawyers.ts correo1@ejemplo.com correo2@ejemplo.com');
    process.exit(1);
}

async function main() {
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    for (const email of emails) {
        console.log(`\nPromoviendo a: ${email}...`);
        
        const user = await prisma.user.findUnique({
            where: { email },
            include: { lawyerProfile: true }
        });

        if (!user) {
            console.log(`❌ ERROR: No se encontró un usuario con el correo ${email}`);
            continue;
        }

        if (user.role !== 'lawyer') {
            console.log(`❌ ERROR: El usuario ${email} no tiene el rol de abogado (role: ${user.role})`);
            continue;
        }

        if (!user.lawyerProfile) {
            console.log(`❌ ERROR: El usuario ${email} no tiene un perfil de abogado en la DB. Asegúrate de que fue sincronizado.`);
            continue;
        }

        // Actualizar User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                plan: 'PRO',
                planExpiresAt: ninetyDaysFromNow
            }
        });

        // Actualizar Lawyer Profile
        await prisma.lawyer.update({
            where: { id: user.lawyerProfile.id },
            data: {
                subscriptionStatus: 'active',
                subscriptionEndDate: ninetyDaysFromNow,
                isVerified: true // Aprovechamos para verificarlo de una vez
            }
        });

        console.log(`✅ ¡Éxito! ${email} ahora es PRO y está verificado. Expiración: ${ninetyDaysFromNow.toLocaleDateString()}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
