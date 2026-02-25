const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando carga de datos en la Base de Datos SQLite (Producción)...');

    // Directorio de Estados
    await prisma.stateDirectory.upsert({
        where: { stateName: 'Ciudad de México' },
        update: {},
        create: {
            stateName: 'Ciudad de México',
            profedetAddress: 'Dr. José María Vértiz 211, Doctores, CDMX',
            localProcuraduriaAddress: 'San Antonio Abad 122, Tránsito, CDMX'
        }
    });

    await prisma.stateDirectory.upsert({
        where: { stateName: 'Jalisco' },
        update: {},
        create: {
            stateName: 'Jalisco',
            profedetAddress: 'Palacio Federal, Av. Alcalde 500, Guadalajara',
            localProcuraduriaAddress: 'Av. Las Palmas 96, La Aurora, Guadalajara'
        }
    });

    await prisma.stateDirectory.upsert({
        where: { stateName: 'Nuevo León' },
        update: {},
        create: {
            stateName: 'Nuevo León',
            profedetAddress: 'Zaragoza 1000 Sur, Monterrey',
            localProcuraduriaAddress: 'Churubusco 495, Monterrey'
        }
    });

    // Matriz de Competencias
    const baseCompetences = [
        {
            sector: 'Industria Textil',
            competence: 'FEDERAL',
            baseInstance: 'PROFEDET',
            keywords: 'fábrica de telas, maquila textil, costura industrial, hilos'
        },
        {
            sector: 'Restaurantes y Servicios de Alimentos',
            competence: 'LOCAL',
            baseInstance: 'Procuraduría Estatal de la Defensa del Trabajo',
            keywords: 'restaurante, mesero, cocinero, bar, cafetería, fonda, comida, chef'
        },
        {
            sector: 'Industria Automotriz y Autopartes',
            competence: 'FEDERAL',
            baseInstance: 'PROFEDET',
            keywords: 'armadora de autos, autopartes, fábrica de coches, ensamble automotriz, mecánico industrial, chevrolet, nissan'
        }
    ];

    for (const comp of baseCompetences) {
        // En SQLite / Prisma actual, insertamos a menos que ya exista
        const exists = await prisma.industryCompetence.findFirst({
            where: { sector: comp.sector }
        });

        if (!exists) {
            await prisma.industryCompetence.create({
                data: comp
            });
        }
    }

    console.log('✅ Bases cargadas exitosamente!');
}

main()
    .catch((e) => {
        console.error('Error al insertar datos:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
