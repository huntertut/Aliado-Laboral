import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log('--- Iniciando Corrección de Roles de Usuario ---');

  // 1. Obtener todos los usuarios que tienen un perfil en la tabla Lawyer
  const lawyers = await prisma.lawyer.findMany({
    include: {
      user: true
    }
  });

  console.log(`Encontrados ${lawyers.length} registros en la tabla Lawyer.`);

  let updatedCount = 0;

  for (const lawyer of lawyers) {
    if (lawyer.user && lawyer.user.role !== 'lawyer') {
      console.log(`Corrigiendo rol para: ${lawyer.user.email} (${lawyer.user.role} -> lawyer)`);
      await prisma.user.update({
        where: { id: lawyer.userId },
        data: { role: 'lawyer' }
      });
      updatedCount++;
    }
  }

  // 2. Corregir a Samuel específicamente por si acaso
  const samuel = await prisma.user.findFirst({
    where: { email: 'lic.samuel@hotmail.com' }
  });

  if (samuel && samuel.role !== 'lawyer') {
      console.log(`Asegurando rol de abogado para Samuel...`);
      await prisma.user.update({
        where: { id: samuel.id },
        data: { role: 'lawyer' }
      });
      updatedCount++;
  }

  console.log(`--- Corrección Finalizada ---`);
  console.log(`Usuarios actualizados: ${updatedCount}`);
}

fixUserRoles()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
