"use strict";
/**
 * Seed de Cursos - Aliado Laboral
 * Ejecutar con: npx ts-node prisma/seedCourses.ts
 * O desde el backend compilado: node dist/prisma/seedCourses.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Iniciando seed de cursos...');
    // ─────────────────────────────────────────
    // CURSO 1: Cómo reclamar tu liquidación
    // ─────────────────────────────────────────
    const curso1 = await prisma.course.upsert({
        where: { id: 'curso-liquidacion-mx-001' },
        update: {},
        create: {
            id: 'curso-liquidacion-mx-001',
            title: 'Cómo reclamar tu liquidación correctamente',
            description: 'Aprende paso a paso cómo calcular, exigir y cobrar tu liquidación laboral en México. Conoce tus derechos, los plazos legales y cómo presentar una demanda ante la JFCA o TEFCA si tu patrón se niega a pagarte.',
            category: 'defense',
            price: 149.00,
            coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
            isActive: true,
            modules: {
                create: [
                    {
                        title: 'Módulo 1 — ¿Qué es la liquidación y cuándo te corresponde?',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: 'Introducción: Despido vs Renuncia',
                                    sortOrder: 1,
                                    durationMin: 8,
                                    content: `# Despido vs Renuncia: La diferencia que vale tu dinero

## ¿Qué es la liquidación?

La **liquidación** es el pago al que tienes derecho cuando tu patrón decide terminar la relación laboral **sin causa justificada**.

## Casos en los que te corresponde liquidación

- ✅ Te despidieron sin previo aviso
- ✅ Te presionaron para renunciar (despido indirecto)
- ✅ Tu empresa cerró o quebró
- ✅ Tu contrato terminó y no se renovó sin justificación

## Casos en los que NO aplica

- ❌ Renuncia voluntaria libre de presiones
- ❌ Despido con causa justificada debidamente documentada (robo, faltas, etc.)

## La Ley Federal del Trabajo dice...

El **Artículo 48 LFT** establece que el trabajador podrá solicitar la reinstalación en su puesto **o** una **indemnización constitucional** equivalente a:

> 3 meses de salario + 20 días por año trabajado + partes proporcionales

En la siguiente lección calculamos exactamente cuánto te deben.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                                {
                                    title: 'Cómo calcular tu liquidación exacta',
                                    sortOrder: 2,
                                    durationMin: 12,
                                    content: `# Fórmula oficial para calcular tu liquidación

## Componentes de la liquidación

### 1. Indemnización constitucional (Art. 50 LFT)
\`\`\`
3 meses de salario diario integrado
+ 20 días por año trabajado (o fracción de más de 6 meses)
\`\`\`

### 2. Partes proporcionales (siempre se deben pagar)
- **Aguinaldo proporcional**: 15 días de salario / 12 meses × meses trabajados en el año
- **Vacaciones proporcionales**: según tabla del Art. 76 LFT
- **Prima vacacional**: 25% de los días de vacaciones
- **Prima de antigüedad**: 12 días de salario por año (Art. 162 LFT)

## Ejemplo práctico

**Datos:**
- Salario mensual: $12,000
- Tiempo trabajado: 3 años 4 meses
- Salario diario: $400

**Cálculo:**
\`\`\`
Indemnización: ($400 × 90 días) + ($400 × 20 días × 3.33 años)
             = $36,000 + $26,640 = $62,640
Aguinaldo prop.: $400 × 15 / 12 × 4 = $2,000
Vacaciones prop.: $400 × 14 / 12 × 4 = $1,867
Prima vacacional: $1,867 × 25% = $467
Prima antigüedad: $400 × 12 × 3.33 = $15,984

TOTAL: $82,958 aprox.
\`\`\`

Usa la calculadora de Aliado Laboral para obtener tu cifra exacta.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: 'checklist-liquidacion.pdf',
                                },
                            ]
                        }
                    },
                    {
                        title: 'Módulo 2 — Cómo exigir tu pago',
                        sortOrder: 2,
                        lessons: {
                            create: [
                                {
                                    title: 'Pasos antes de demandar: Carta Alícuota y IMSS',
                                    sortOrder: 1,
                                    durationMin: 10,
                                    content: `# Antes de ir al tribunal: pasos clave

## Paso 1: Reúne tu documentación

Necesitas tener listos:
- 📄 Contrato de trabajo (si existe)
- 📄 Recibos de nómina (últimos 3 meses)
- 📄 Carta de despido (si te la dieron)
- 📄 Credencial del IMSS / Número de Seguridad Social
- 📄 Comprobante de domicilio

## Paso 2: Verifica tu historial ante el IMSS

Entra a **my.imss.gob.mx** con tu CURP o NSS para:
- Confirmar tu salario registrado
- Ver las semanas cotizadas
- Verificar si tu patrón estaba al corriente

⚠️ Si tu salario real era diferente al registrado en el IMSS, eso puede aumentar tu liquidación.

## Paso 3: Solicita conciliación ANTES de demandar

Desde 2019, la **Reforma Laboral** exige pasar primero por el **CFCRL (Centro Federal de Conciliación)**.

La conciliación es gratuita, rápida (máx. 45 días) y evita el juicio.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                                {
                                    title: 'Cómo presentar una demanda laboral (TEFCA)',
                                    sortOrder: 2,
                                    durationMin: 15,
                                    content: `# Guía para presentar demanda ante el Tribunal

## ¿Cuándo demandar?

Si la conciliación fracasó o el patrón no acudió, puedes presentar demanda ante el **Tribunal Federal de Conciliación y Arbitraje (TEFCA)** o los **Tribunales Laborales** locales.

## Plazo para demandar

⚠️ **Tienes 2 años desde la fecha de despido** para presentar tu demanda (Art. 519 LFT).

No esperes.

## Documentos para la demanda

1. Escrito de demanda (puedes hacerlo sin abogado)
2. Copia de tu INE
3. Copia de documentos laborales
4. Hoja de cálculo de la liquidación reclamada

## Opciones si no tienes abogado

- **PROFEDET**: asesoría jurídica gratuita para trabajadores
- **Aliado Laboral**: conecta con abogados laborales verificados
- **Defensoría Pública**: disponible en cada entidad

## Tip importante

Si el patrón no puede demostrar que el despido fue justificado, **el juicio casi siempre lo gana el trabajador**.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                            ]
                        }
                    }
                ]
            }
        }
    });
    console.log('✅ Curso 1 creado:', curso1.title);
    // ─────────────────────────────────────────
    // CURSO 2: Tus derechos ante el IMSS
    // ─────────────────────────────────────────
    const curso2 = await prisma.course.upsert({
        where: { id: 'curso-imss-derechos-002' },
        update: {},
        create: {
            id: 'curso-imss-derechos-002',
            title: 'Tus derechos ante el IMSS que nadie te enseñó',
            description: 'Descubre los beneficios del IMSS que millones de mexicanos desconocen: incapacidades, guarderías, pensión por invalidez, seguro de desempleo y cómo reclamarlos sin que te rechacen.',
            category: 'retirement',
            price: 99.00,
            coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
            isActive: true,
            modules: {
                create: [
                    {
                        title: 'Módulo 1 — IMSS: Lo básico que debes saber',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: '¿Qué cubre realmente el IMSS? (guía completa)',
                                    sortOrder: 1,
                                    durationMin: 10,
                                    content: `# Todo lo que el IMSS cubre (y que pocos conocen)

## Las 5 ramas del Seguro Social

### 1. 🏥 Enfermedades y Maternidad
- Consultas médicas sin costo
- Medicamentos del cuadro básico
- Hospitalización y cirugías
- Atención de embarazo y parto

### 2. 💼 Riesgos de Trabajo
- Si te accidentas en el trabajo o de camino al trabajo
- El IMSS paga el 100% del salario durante la incapacidad
- Pensión permanente si queda una secuela

### 3. 👴 Invalidez y Vida
- Pensión si no puedes trabajar por enfermedad no laboral
- Seguro de vida para tus beneficiarios

### 4. 🏖️ Retiro, Cesantía y Vejez
- Tu pensión al jubilarte (AFORE)
- Modalidad 40 para aumentar tu pensión

### 5. 🏠 Guarderías y Prestaciones Sociales
- Guarderías IMSS para hijos de madres trabajadoras
- Vacaciones en centros vacacionales IMSS

## ⚠️ Requisito clave: semanas cotizadas

Cada prestación requiere un mínimo de semanas cotizadas. En la siguiente lección te enseñamos a contarlas.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                                {
                                    title: 'Cómo revisar tus semanas cotizadas',
                                    sortOrder: 2,
                                    durationMin: 7,
                                    content: `# Cómo consultar tus semanas cotizadas en el IMSS

## Opción 1: Portal Mi IMSS (más rápido)

1. Entra a **www.imss.gob.mx**
2. Clic en "Mi Portal"
3. Regístrate con tu NSS (Número de Seguridad Social) y CURP
4. En el menú: **Mis Trámites → Historial Laboral**

## Opción 2: App IMSS Digital

Descarga la app **IMSS Digital** en tu smartphone:
- Consulta semanas cotizadas
- Ver estado de tus incapacidades
- Solicitar citas médicas

## Opción 3: Presencial

En cualquier **Subdelegación IMSS** con:
- INE vigente
- NSS (está en tu credencial IMSS o recibes de nómina)

## ¿Para qué sirve conocer tus semanas?

| Prestación | Semanas mínimas |
|---|---|
| Pensión por vejez (Ley 97) | 1,250 semanas |
| Pensión por invalidez | 250 semanas |
| Seguro de desempleo | 24 semanas |
| Incapacidad por enfermedad | 4 semanas |`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                            ]
                        }
                    },
                    {
                        title: 'Módulo 2 — Incapacidades y Seguro de Desempleo',
                        sortOrder: 2,
                        lessons: {
                            create: [
                                {
                                    title: 'Cómo tramitar una incapacidad correctamente',
                                    sortOrder: 1,
                                    durationMin: 9,
                                    content: `# Guía para tramitar incapacidad ante el IMSS

## Tipos de incapacidad

### Incapacidad por enfermedad general
- Requiere **mínimo 4 semanas cotizadas** en los últimos 8 meses
- El IMSS paga el **60% de tu salario** desde el 4° día
- Los primeros 3 días los paga el patrón (si aplica el convenio)

### Incapacidad por riesgo de trabajo
- No requiere semanas mínimas
- El IMSS paga el **100% de tu salario** desde el primer día

### Incapacidad por maternidad
- 84 días (42 antes del parto + 42 después)
- El IMSS paga el **100% de tu salario base**

## Paso a paso para tramitarla

1. **Ve al módulo de medicina familiar** de tu clínica IMSS asignada
2. El médico emite el **Certificado de Incapacidad Temporal (CIT)**
3. Entrega una copia a tu patrón dentro de las **72 horas**
4. El IMSS deposita directamente en tu cuenta bancaria

## ⚠️ Errores comunes

- ❌ No ir al médico IMSS (ir a médico particular no cuenta)
- ❌ Avisar tarde al patrón (puede impugnarla)
- ❌ Trabajar durante la incapacidad (pierdes el derecho)`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                                {
                                    title: 'Seguro de desempleo: cómo solicitarlo',
                                    sortOrder: 2,
                                    durationMin: 8,
                                    content: `# Seguro de Desempleo IMSS: pocos lo saben usar

## ¿Qué es?

El **Seguro de Desempleo** del IMSS permite retirar parte de los fondos de tu **subcuenta de retiro** (AFORE) cuando pierdes tu empleo.

## Requisitos

- Tener **mínimo 24 semanas** cotizadas en los últimos 2 años
- Llevar **al menos 45 días desempleado**
- No haber utilizado este beneficio en los últimos **5 años**

## ¿Cuánto puedes retirar?

Puedes retirar hasta **10 veces el salario mínimo** mensual por cada año de aportación, con un máximo de **90 días** de cuota social más las aportaciones de tu AFORE de retiro.

## Cómo tramitarlo

1. Acude a cualquier **AFORE** o **Subdelegación IMSS**
2. Lleva: INE, NSS, CURP, estado de cuenta bancario
3. Demuestra la baja del IMSS (con la baja laboral o carta del patrón)
4. El trámite tarda entre 5 y 10 días hábiles

## Importante

Usar el seguro de desempleo **reduce el saldo de tu AFORE** para el retiro. Úsalo solo si realmente lo necesitas.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                            ]
                        }
                    }
                ]
            }
        }
    });
    console.log('✅ Curso 2 creado:', curso2.title);
    // ─────────────────────────────────────────
    // CURSO 3: Freelancer e independiente
    // ─────────────────────────────────────────
    const curso3 = await prisma.course.upsert({
        where: { id: 'curso-freelancer-mx-003' },
        update: {},
        create: {
            id: 'curso-freelancer-mx-003',
            title: 'Protégete como freelancer o trabajador independiente',
            description: 'Si trabajas sin contrato formal, por honorarios o como "outsourcing", este curso te enseña a proteger tus ingresos, cobrar sin miedo y cotizar voluntariamente al IMSS.',
            category: 'freelancer',
            price: 129.00,
            coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80',
            isActive: true,
            modules: {
                create: [
                    {
                        title: 'Módulo 1 — Tu situación legal como independiente',
                        sortOrder: 1,
                        lessons: {
                            create: [
                                {
                                    title: '¿Eres empleado disfrazado de freelancer?',
                                    sortOrder: 1,
                                    durationMin: 10,
                                    content: `# ¿Eres realmente independiente o un empleado sin derechos?

## El problema del "outsourcing" informal

Muchas empresas contratan trabajadores "por honorarios" para evitar pagar prestaciones. Esto es ilegal si en la práctica actúas como empleado.

## ¿Cómo saber si la ley te considera empleado?

La **Ley Federal del Trabajo** establece que hay relación laboral cuando:

1. ✅ Tienes **horario fijo** asignado por la empresa
2. ✅ Usas **equipo o herramientas** de la empresa
3. ✅ Recibes **instrucciones directas** de un jefe
4. ✅ Tu trabajo es **continuo y permanente** (no por proyectos)
5. ✅ Trabajas **exclusivamente** para esa empresa

Si se cumplen 3 o más condiciones → **la ley te considera empleado**, aunque firmes un contrato de servicios.

## ¿Qué puedes hacer?

- Demandar el reconocimiento de la relación laboral
- Exigir prestaciones de ley con efecto retroactivo (hasta 2 años)
- Solicitar inscripción al IMSS

## Si realmente eres freelancer legítimo

En los siguientes módulos te enseñamos a **protegerte legalmente** y **cotizar voluntariamente al IMSS** para tener salud y pensión.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: null,
                                },
                                {
                                    title: 'Contratos de servicios: cómo protegerte',
                                    sortOrder: 2,
                                    durationMin: 12,
                                    content: `# Cómo redactar contratos que te protejan como freelancer

## Elementos mínimos de un contrato de servicios

Un buen contrato de servicios profesionales debe incluir:

### 1. Descripción del proyecto
- Alcance exacto del trabajo
- Qué **NO** incluye (evita scope creep)

### 2. Forma de pago
- Monto total y moneda
- Calendario de pagos (anticipo + saldos)
- Consecuencias por retraso en pago

### 3. Propiedad intelectual
- ¿A quién pertenece el trabajo entregado?
- ¿Cuándo se transfiere? (al pago total, no antes)

### 4. Cláusula de cancelación
- Qué pasa si el cliente cancela a mitad del proyecto
- Penalización por cancelación

### 5. Confidencialidad
- Protege la información del cliente
- También protege tus métodos de trabajo

## ⚠️ Errores más comunes

- ❌ Trabajar sin contrato (fiarle al cliente)
- ❌ No cobrar anticipo (mínimo 30-50%)
- ❌ Entregar el trabajo antes del pago final
- ❌ No especificar cuántas revisiones están incluidas

## Recurso descargable

Descarga nuestra plantilla de contrato de servicios profesionales adaptada a la legislación mexicana.`,
                                    videoUrl: null,
                                    attachmentUrl: null,
                                    attachmentName: 'plantilla-contrato-servicios.pdf',
                                },
                            ]
                        }
                    }
                ]
            }
        }
    });
    console.log('✅ Curso 3 creado:', curso3.title);
    console.log('\n🎉 Seed completado exitosamente.');
    console.log('📚 Total de cursos creados: 3');
    console.log('   - Cómo reclamar tu liquidación (defense) - $149 MXN');
    console.log('   - Tus derechos ante el IMSS (retirement) - $99 MXN');
    console.log('   - Protégete como freelancer (freelancer) - $129 MXN');
}
main()
    .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
