import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserToPro() {
    try {
        // Update worker_pro@test.com to have PRO plan
        const user = await prisma.user.update({
            where: { email: 'worker_pro@test.com' },
            data: { plan: 'PRO' }
        });

        console.log('✅ Usuario actualizado a PRO:', user.email, '- Plan:', user.plan);
    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateUserToPro();
