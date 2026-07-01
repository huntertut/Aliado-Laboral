import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando carga de cursos demo...');

    // Limpiar cursos anteriores para evitar duplicidad en desarrollo
    await prisma.course.deleteMany().catch(() => {});

    // 1. Curso Bestseller: Pensiones
    const course1 = await prisma.course.create({
        data: {
            title: 'Domina la Modalidad 40: Cómo jubilarte con una pensión top',
            description: 'Todo lo que necesitas saber en México sobre el retiro bajo la Ley 73 y Ley 97 del IMSS. Aprende paso a paso cómo invertir inteligentemente para maximizar el dinero de tu vejez.',
            price: 199.00,
            category: 'retirement',
            coverImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=400&auto=format&fit=crop',
            modules: {
                create: [
                    {
                        title: 'Módulo 1: Fundamentos de la Modalidad 40',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Lección 1: ¿Qué es la Modalidad 40 y quiénes califican?',
                                    content: `### ¿Qué es la Modalidad 40?
La Modalidad 40 (o Continuación Voluntaria en el Régimen Obligatorio) es un derecho de los trabajadores que comenzaron a cotizar ante el IMSS antes del 1 de julio de 1997. Les permite realizar aportaciones voluntarias para seguir acumulando semanas y elevar su salario promedio de los últimos 5 años.

### Requisitos clave:
1. Pertenecer a la **Ley 73 del IMSS** (haber cotizado antes del 1 de julio de 1997).
2. Tener al menos **52 semanas cotizadas** en los últimos 5 años.
3. No haber dejado pasar más de **5 años** desde la fecha de tu última baja laboral.

En esta lección analizaremos paso a paso si este esquema es conveniente para tu caso particular.`,
                                    videoUrl: 'https://vimeo.com/769798717', // Enlace demo
                                    durationMin: 8,
                                    sortOrder: 1,
                                    attachmentUrl: 'https://api.cibertmx.org/assets/checklists/checklist_modalidad40.pdf',
                                    attachmentName: 'Checklist de Requisitos Modalidad 40.pdf'
                                },
                                {
                                    title: 'Lección 2: Diferencias críticas entre Ley 73 y Ley 97',
                                    content: `Es fundamental entender bajo qué régimen estás cotizando para tomar decisiones de retiro:

- **Ley 73:** Tu pensión se calcula basándose en el promedio de tu salario de los últimos 5 años laborados y el número total de semanas cotizadas. La pensión la paga el Gobierno Federal y aumenta anualmente con la inflación.
- **Ley 97:** Tu pensión dependerá exclusivamente del dinero ahorrado en tu cuenta Afore.

*Nota:* Modalidad 40 solo genera un impacto significativo en la Ley 73.`,
                                    videoUrl: 'https://vimeo.com/769798717',
                                    durationMin: 12,
                                    sortOrder: 2
                                }
                            ]
                        }
                    },
                    {
                        title: 'Módulo 2: Estrategia de Inversión y Trámites',
                        sortOrder: 2,
                        lessons: {
                            create: [
                                {
                                    title: 'Lección 3: Cómo calcular el costo de tu inversión mensual',
                                    content: `### Costo de la Modalidad 40
Para este año, el costo mensual equivale al **12.256%** del salario diario integrado con el que decidas registrarte.

Si te registras con el salario tope (25 UMAS), la inversión mensual aproximada es de poco más de **$10,000 pesos**. Analizaremos cómo financiar esta estrategia de retiro y el retorno de inversión promedio.`,
                                    videoUrl: 'https://vimeo.com/769798717',
                                    durationMin: 15,
                                    sortOrder: 1,
                                    attachmentUrl: 'https://api.cibertmx.org/assets/simuladores/simulador_pension.xlsx',
                                    attachmentName: 'Simulador Básico de Retorno.xlsx'
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // 2. Curso de Defensa Laboral
    const course2 = await prisma.course.create({
        data: {
            title: 'Renuncia vs. Despido Injustificado: Defiende tus Derechos',
            description: 'Aprende las diferencias legales cruciales entre renunciar voluntariamente y ser despedido. Te damos guiones exactos sobre qué responder ante Recursos Humanos y cómo documentar pruebas válidas para no perder tu dinero.',
            price: 99.00,
            category: 'defense',
            coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop',
            modules: {
                create: [
                    {
                        title: 'Módulo 1: La diferencia en el bolsillo',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Lección 1: ¿Cuánto dinero te corresponde en cada caso?',
                                    content: `### Renuncia Voluntaria (Finiquito)
Solo te corresponde el pago de las partes proporcionales de:
- Aguinaldo
- Vacaciones
- Prima vacacional
- Salarios devengados pendientes de pago

### Despido Injustificado (Liquidación)
Te corresponde el finiquito MÁS las indemnizaciones constitucionales:
- **3 meses de salario diario** (Indemnización Constitucional)
- **20 días de salario por cada año de servicios** prestado (si demandas la reinstalación y el patrón se niega)
- **Prima de antigüedad:** 12 días de salario por cada año trabajado (topado a dos salarios mínimos)

¡Conocer esta diferencia puede equivaler a miles de pesos a tu favor!`,
                                    videoUrl: 'https://vimeo.com/769798717',
                                    durationMin: 10,
                                    sortOrder: 1,
                                    attachmentUrl: 'https://api.cibertmx.org/assets/templates/guia_negociacion_rrhh.pdf',
                                    attachmentName: 'Guía de Negociación Recursos Humanos.pdf'
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // 3. Curso Freelancer
    const course3 = await prisma.course.create({
        data: {
            title: 'Freelancer con Seguro: Cómo afiliarte al IMSS por tu cuenta',
            description: 'Guía práctica para trabajadores independientes, emprendedores y freelancers sobre cómo cotizar de manera voluntaria al IMSS bajo la Modalidad 10. Conoce los costos, coberturas y cómo proteger tu salud y tu retiro.',
            price: 99.00,
            category: 'freelancer',
            coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=400&auto=format&fit=crop',
            modules: {
                create: [
                    {
                        title: 'Módulo 1: La Modalidad 10 para independientes',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Lección 1: ¿Qué es la Modalidad 10 y qué beneficios te da?',
                                    content: `### Modalidad 10 del IMSS
Es el esquema diseñado específicamente para trabajadores independientes. A diferencia de la Modalidad 40, la Modalidad 10 te otorga cobertura médica completa, incapacidades por enfermedad o maternidad, y cotización para tu cuenta de Afore/pensiones.

### Beneficios incluidos:
1. Servicios médicos generales, especialidades y cirugías para ti y tus beneficiarios directos (padres, hijos, cónyuge).
2. Pago de incapacidades de trabajo.
3. Cotización para retiro y pensión.
4. Acceso a guarderías y prestaciones sociales.`,
                                    videoUrl: 'https://vimeo.com/769798717',
                                    durationMin: 12,
                                    sortOrder: 1
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    // 4. Curso de Navegación Burocrática (Incapacidades)
    const course4 = await prisma.course.create({
        data: {
            title: 'Incapacidades y Riesgos de Trabajo: Que el IMSS te pague lo justo',
            description: 'Aprende a navegar el proceso burocrático ante el IMSS en caso de enfermedad general, maternidad o accidente de trabajo. Evita que te rechacen tus trámites y asegura el pago del 100% de tu sueldo cuando más lo necesitas.',
            price: 99.00,
            category: 'bureaucracy',
            coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=400&auto=format&fit=crop',
            modules: {
                create: [
                    {
                        title: 'Módulo 1: Accidentes y Riesgos Laborales',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Lección 1: Cómo llenar y reportar la forma ST-7 de Riesgo de Trabajo',
                                    content: `### La forma ST-7 (Aviso de Atención Médica Inicial y Calificación de Probable Accidente de Trabajo)
Es el documento más importante si te lesionas en tu jornada de trabajo o en el trayecto de tu casa al trabajo.

### Puntos clave:
- Debes pedirle al médico familiar o urgencias que inicie el trámite.
- El patrón tiene la obligación de llenar su parte del reporte en un plazo máximo de 72 horas.
- Si se califica como **Sí de Trabajo**, el IMSS te paga el **100% de tu salario registrado** desde el primer día. Si es enfermedad general, solo te pagan el 60% a partir del cuarto día. ¡Por eso es vital tramitarlo correctamente!`,
                                    videoUrl: 'https://vimeo.com/769798717',
                                    durationMin: 15,
                                    sortOrder: 1,
                                    attachmentUrl: 'https://api.cibertmx.org/assets/templates/guia_formato_st7.pdf',
                                    attachmentName: 'Guía de Llenado Formato ST-7 IMSS.pdf'
                                }
                            ]
                        }
                    }
                ]
            }
        }
    });

    console.log(`✅ Cursos demo cargados con éxito!
- Curso 1: ${course1.title} (${course1.id})
- Curso 2: ${course2.title} (${course2.id})
- Curso 3: ${course3.title} (${course3.id})
- Curso 4: ${course4.title} (${course4.id})
`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
