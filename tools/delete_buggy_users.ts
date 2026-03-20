import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const emailsToDelete = [
    'miguelangelclimacoflores@gmail.com',
    'tor@antonio.clm',
    'admonteregob@gmail.com'
];

async function main() {
    console.log('Iniciando limpieza de usuarios...');

    for (const email of emailsToDelete) {
        try {
            const user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                console.log(`Borrando usuario: ${email} (ID: ${user.id})`);

                // Borrar primero los roles asociados por las llaves foráneas
                await prisma.userRole.deleteMany({
                    where: { userId: user.id }
                });

                // Borrar luego el perfil de trabajador si existe
                await prisma.workerProfile.deleteMany({
                    where: { userId: user.id }
                });

                // Finalmente borrar el usuario principal
                await prisma.user.delete({
                    where: { id: user.id }
                });

                console.log(`✅ ${email} eliminado correctamente.`);
            } else {
                console.log(`ℹ️ ${email} no encontrado en la base de datos.`);
            }
        } catch (error) {
            console.error(`❌ Error al borrar ${email}:`, error);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
