export interface DerechoPanelCalculator {
    id: string;
    title: string;
    description: string;
    icon: string;
    inputs: Array<{
        id: string;
        label: string;
        type: 'date' | 'number' | 'text';
        required: boolean;
        placeholder?: string;
        infoTooltip?: string;
        sourceProfileField?: 'monthlySalary' | 'startDate'; // New field for auto-fill
    }>;
}

export interface DerechoPanelGuide {
    id: string;
    title: string;
    description: string;
    icon: string;
    content: string;
}

export interface DerechoPanelChecklistItem {
    id: string;
    title: string;
    description: string;
    icon: string;
    userQuestion: string;
    relatedProblemId?: string;
}


export const RIGHTS_CALCULATORS: DerechoPanelCalculator[] = [
    {
        id: 'calculadora-aguinaldo',
        title: 'Calculadora de Aguinaldo',
        description: 'El aguinaldo es un derecho que te corresponde por tu trabajo durante el año. La ley establece un **mínimo de 15 días de salario**. Úsala para calcular la cantidad exacta que te deben pagar, incluso si solo trabajaste una parte del año.',
        icon: 'gift',
        inputs: [
            {
                id: 'fecha-ingreso-anio',
                label: '¿Cuándo empezaste a trabajar este año?',
                type: 'date',
                required: true,
                infoTooltip: 'Si trabajaste todo el año, selecciona el 1 de enero. Si empezaste después, selecciona tu fecha de ingreso.',
                sourceProfileField: 'startDate'
            },
            {
                id: 'salario-diario-integrado',
                label: '¿Cuál es tu Salario Diario Integrado?',
                type: 'number',
                required: true,
                placeholder: 'Ej: 600',
                infoTooltip: 'Calculado automáticamente de tu salario mensual (entre 30.4). Puedes editarlo si es necesario.',
                sourceProfileField: 'monthlySalary'
            }
        ]
    },
    {
        id: 'calculadora-vacaciones',
        title: 'Calculadora de Vacaciones y Prima',
        description: 'Tus días de vacaciones aumentan cada año según tu antigüedad. Además, tienes derecho a una **Prima Vacacional**, que es un pago extra del 25% sobre el salario que corresponde a tus días de vacaciones. ¡Calcula cuánto te deben!',
        icon: 'sunny',
        inputs: [
            {
                id: 'fecha-ingreso',
                label: '¿Cuál es tu fecha de ingreso a la empresa?',
                type: 'date',
                required: true,
                infoTooltip: 'Necesitamos esta fecha para calcular cuántos años llevas trabajando y así saber cuántos días de vacaciones te corresponden.',
                sourceProfileField: 'startDate'
            },
            {
                id: 'salario-diario-integrado',
                label: '¿Cuál es tu Salario Diario Integrado?',
                type: 'number',
                required: true,
                placeholder: 'Ej: 600',
                infoTooltip: 'Calculado automáticamente de tu salario mensual (entre 30.4). Puedes editarlo si es necesario.',
                sourceProfileField: 'monthlySalary'
            },
            {
                id: 'dias-tomados',
                label: '¿Cuántos días de vacaciones ya tomaste este año?',
                type: 'number',
                required: false,
                placeholder: 'Ej: 5',
                infoTooltip: 'Opcional. Si lo pones, calcularemos el valor de los días que te faltan por disfrutar.'
            }
        ]
    },
    {
        id: 'calculadora-ptu',
        title: 'Calculadora de PTU (Estimación)',
        description: 'Estima cuánto deberías recibir de PTU. Necesitarás algunos datos de la empresa o realizar estimaciones.',
        icon: 'cash',
        inputs: [
            {
                id: 'numero-trabajadores',
                label: 'Número total de trabajadores en la empresa',
                type: 'number',
                required: true,
                placeholder: 'Ej: 50',
                infoTooltip: 'Es el número total de empleados, incluyendo a todos los niveles.'
            },
            {
                id: 'utilidad-empresa',
                label: 'Utilidad Gravable de la empresa (opcional)',
                type: 'number',
                required: false,
                placeholder: 'Ej: 5000000',
                infoTooltip: 'Si no tienes este dato, puedes dejarlo vacío y usaremos el tope legal (3 meses) para darte una estimación máxima.'
            },
            {
                id: 'salario-anual',
                label: 'Tu salario anual bruto',
                type: 'number',
                required: true,
                placeholder: 'Ej: 180000',
                infoTooltip: 'Es tu salario mensual multiplicado por 12, más otras percepciones anuales como aguinaldo.'
            },
            {
                id: 'suma-salarios-todos',
                label: 'Suma de salarios de todos los trabajadores',
                type: 'number',
                required: false,
                placeholder: 'Ej: 9000000',
                infoTooltip: 'Dato difícil de conseguir. Si lo dejas vacío, estimaremos usando tu salario como promedio (poco preciso pero útil como referencia).'
            }
        ]
    },
    {
        id: 'herramienta-consulta-infonavit',
        title: 'Mi Consultor INFONAVIT',
        description: 'Te guiaremos paso a paso para que conozcas tu situación actual en el INFONAVIT y sepas qué puedes hacer.',
        icon: 'search',
        inputs: [] // No standard inputs, custom UI
    },
    {
        id: 'herramienta-consulta-fonacot',
        title: 'Mi Consultor FONACOT',
        description: 'Te guiaremos paso a paso para que sepas si eres elegible y cómo empezar tu proceso de crédito.',
        icon: 'card',
        inputs: [] // No standard inputs, custom UI
    }
];

export const RIGHTS_GUIDES: DerechoPanelGuide[] = [
    {
        id: 'guia-rapida-ptu',
        title: 'Guía del Reparto de Utilidades (PTU)',
        description: 'Descubre si tu empresa debe darte utilidades, cuándo se pagan y cuánto te podría tocar.',
        icon: 'cash',
        content: `
# ¿Qué es la PTU?
Es el derecho constitucional de los trabajadores a recibir una parte de las ganancias que obtuvo la empresa o patrón en el año anterior.

## ¿Cuándo se paga?
- **Empresas (Personas Morales):** A más tardar el 30 de mayo.
- **Patrones (Personas Físicas):** A más tardar el 29 de junio.

## ¿Quiénes tienen derecho?
- Trabajadores que hayan laborado **al menos 60 días** en el año.
- Trabajadores de planta o eventuales.

## ¿Quiénes NO reciben?
- Directores, administradores y gerentes generales.
- Socios y accionistas.
- Trabajadores domésticos.
- Quienes trabajaron menos de 60 días en el año.

## ¿Cómo se calcula?
La empresa reparte el 10% de sus utilidades netas. Ese monto se divide en dos partes iguales:
1. **50%:** Se reparte igual entre todos los trabajadores, considerando los días trabajados.
2. **50%:** Se reparte proporcionalmente según el salario de cada trabajador.

**¡Ojo!** Si la empresa declara que no tuvo ganancias, no hay reparto.
        `
    },
    {
        id: 'guia-rapida-infonavit',
        title: 'Guía Rápida de INFONAVIT',
        description: 'Entiende cómo funciona tu crédito de vivienda, los puntos necesarios y tus derechos ante el instituto.',
        icon: 'home',
        content: `
# Tu Derecho a la Vivienda (INFONAVIT)
El patrón debe aportar el **5% de tu salario** a tu Subcuenta de Vivienda. Este dinero es tuyo y sirve para pedir un crédito o para tu retiro.

## ¿Para qué sirve el crédito?
1. **Comprar:** Casa nueva o usada.
2. **Construir:** En un terreno propio.
3. **Mejorar:** Ampliar o reparar tu casa actual.
4. **Pagar:** Una hipoteca que tengas con un banco.

## Los famosos "Puntos"
Necesitas **1080 puntos** para solicitar un crédito. Los puntos se calculan con:
- Tu edad y salario.
- Tu ahorro en la Subcuenta de Vivienda.
- La cotización continua (tiempo sin dejar de trabajar).
- El tipo de trabajador (permanente o eventual).
- La estabilidad laboral de la empresa.

## ¿Qué pasa si pierdo mi empleo?
Tienes derecho a un seguro de desempleo (Fondo de Protección de Pagos) por hasta 6 meses, donde solo pagas el 10% de la mensualidad. ¡Contacta al INFONAVIT de inmediato si esto pasa!
        `
    },
    {
        id: 'guia-rapida-fonacot',
        title: 'Guía Rápida de FONACOT',
        description: 'Aprende a usar FONACOT, tu beneficio para acceder a créditos con mejores condiciones que en la banca.',
        icon: 'card',
        content: `
# ¿Qué es FONACOT?

FONACOT (Fondo Nacional del Consumo para los Trabajadores) es un beneficio que tienes como trabajador afiliado al IMSS para acceder a créditos personales, hipotecarios o para tu negocio, con tasas de interés más bajas y pagos fijos que se descuentan directamente de tu nómina.

## ¿Quién puede solicitar un crédito?

Todos los trabajadores que:
- Estén dados de alta en el IMSS.
- Tengan una antigüedad mínima en su trabajo actual (generalmente 6 meses).
- Cuenten con una capacidad de endeudamiento disponible.

## Tipos de Créditos más Comunes

1. **Crédito Personal:** Para cualquier necesidad: emergencias, vacaciones, estudios, etc.
2. **Crédito Hipotecario:** Para comprar, construir o mejorar tu vivienda.
3. **Crédito para Negocios (PYME):** Si quieres emprender o hacer crecer tu propio negocio.

## ¿Cómo se Paga el Crédito?

La gran ventaja es que los pagos se hacen **automáticamente**. Tu patrón descuenta la mensualidad de tu sueldo y se la paga directamente a FONACOT. No tienes que preocuparte por hacer transferencias ni ir al banco.

## ¿Y si mi patrón no quiere hacer el descuento?

Tu patrón está **obligado por ley** a realizar el descuento de nómina si el crédito te fue aprobado. Si se niega, puedes denunciarlo ante el IMSS o la Procuraduría de la Defensa del Trabajo (PROFEDET).

**Usa nuestra Herramienta de Consulta para saber los primeros pasos.**
        `
    }
];

export const RIGHTS_CHECKLIST: DerechoPanelChecklistItem[] = [
    {
        id: 'checklist-contrato',
        title: 'Contrato por Escrito',
        description: 'Es tu garantía legal. Sin él, es difícil probar tus condiciones laborales.',
        icon: 'document-text',
        userQuestion: '¿Tienes una copia firmada de tu contrato individual de trabajo?',
        relatedProblemId: 'despido_injustificado' // Falta de contrato complica despidos
    },
    {
        id: 'checklist-imss',
        title: 'Alta en el IMSS',
        description: 'Garantiza tu salud y tu ahorro para el retiro.',
        icon: 'medkit',
        userQuestion: '¿Verificaste en la app del IMSS que estás dado de alta con tu salario real?',
        relatedProblemId: 'no_me_dan_derechos'
    },
    {
        id: 'checklist-recibo',
        title: 'Recibos de Nómina',
        description: 'Comprueban tus ingresos y descuentos oficiales.',
        icon: 'receipt',
        userQuestion: '¿Recibes periódicamente (semanal/quincenal) un recibo de nómina timbrado (CFDI)?',
        relatedProblemId: 'no_me_pagan'
    },
    {
        id: 'checklist-vacaciones',
        title: 'Vacaciones Dignas',
        description: 'Descanso pagado para reponer energías.',
        icon: 'airplane',
        userQuestion: '¿Disfrutaste de al menos 12 días de vacaciones en tu primer año de trabajo?',
        relatedProblemId: 'no_me_dan_derechos'
    },
    {
        id: 'checklist-jornada',
        title: 'Jornada Laboral',
        description: 'Límites de tiempo para evitar la explotación.',
        icon: 'time',
        userQuestion: '¿Trabajas máximo 48 horas a la semana (turno diurno) sin que las horas extra sean obligatorias?',
        relatedProblemId: 'no_me_pagan' // Por horas extra no pagadas
    }
];
