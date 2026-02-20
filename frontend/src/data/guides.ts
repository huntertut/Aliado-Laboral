export interface Guide {
    id: string;
    title: string;
    description: string;
    content: string;
}

export const guides: Guide[] = [
    {
        id: '1',
        title: 'Despido Injustificado',
        description: '¿Te despidieron sin razón? Conoce tus derechos y qué te corresponde.',
        content: `
# Despido Injustificado

Si tu patrón te despide sin una causa justificada (como robo, faltas injustificadas, etc.), tienes derecho a:

1. **Indemnización Constitucional:** 3 meses de salario.
2. **Prima de Antigüedad:** 12 días de salario por cada año trabajado.
3. **Partes Proporcionales:** Aguinaldo, vacaciones y prima vacacional que no te hayan pagado.
4. **20 Días por Año:** Solo en casos específicos donde el patrón se niegue a reinstalarte.

**¿Qué hacer?**
- No firmes nada si no estás de acuerdo con la cantidad.
- Tienes 2 meses para demandar a partir del día del despido.
- Acude al Centro de Conciliación Laboral más cercano.
    `
    },
    {
        id: '2',
        title: 'Renuncia Voluntaria',
        description: 'Si decides irte, esto es lo que te toca por ley.',
        content: `
# Renuncia Voluntaria

Si decides dejar tu trabajo por tu propia cuenta, tienes derecho a:

1. **Aguinaldo Proporcional:** La parte del aguinaldo que te corresponde por los meses trabajados en el año.
2. **Vacaciones y Prima Vacacional:** Los días que no hayas disfrutado.
3. **Prima de Antigüedad:** SOLO si tienes más de 15 años trabajando en la empresa.

**Consejo:**
- Entrega tu carta de renuncia por escrito.
- Solicita tu finiquito en el momento o acuerda una fecha de pago.
    `
    },
    {
        id: '3',
        title: 'Acoso Laboral (Mobbing)',
        description: 'Cómo identificar y actuar ante el hostigamiento en el trabajo.',
        content: `
# Acoso Laboral

El acoso laboral o "mobbing" es cualquier trato hostil o vejatorio por parte de jefes o compañeros.

**Ejemplos:**
- Burlas constantes.
- Carga de trabajo excesiva e injustificada.
- Aislamiento.

**Acciones:**
1. **Documenta todo:** Fechas, horas, testigos, grabaciones.
2. **Reporta:** Si hay área de RRHH, presenta una queja formal.
3. **Rescisión de Contrato:** Puedes solicitar la rescisión de la relación laboral por causas imputables al patrón (te vas, pero te indemnizan como si fuera despido injustificado).
    `
    }
];
