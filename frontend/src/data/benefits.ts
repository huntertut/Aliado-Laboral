
export interface PrestacionDeLey {
    id: string;
    title: string;
    icon: string;
    description: string;
    keyInfo: string[];
    calculatorId?: string;
    relatedGuideId?: string;
    relatedProblemId?: string;
    whatIfIDontGetIt: {
        title: string;
        description: string;
        relatedProblemId: string;
    };
}

export const BENEFITS_DATA: PrestacionDeLey[] = [
    // A. Prestaciones en Dinero
    {
        id: 'aguinaldo',
        title: 'Aguinaldo',
        icon: 'gift',
        description: 'Es una prestación que te corresponde por tu trabajo durante el año. La ley establece un mínimo de 15 días de salario, sin importar el tiempo que hayas trabajado en el mismo.',
        keyInfo: [
            'Mínimo de 15 días de tu salario.',
            'Se paga de forma proporcional si no trabajaste el año completo.',
            'La fecha límite de pago es antes del 20 de diciembre.'
        ],
        calculatorId: 'calculadora-aguinaldo',
        whatIfIDontGetIt: {
            title: '¿Y si no me lo pagan?',
            description: 'Es una violación a tus derechos. Puedes exigirlo mediante una demanda.',
            relatedProblemId: 'no_me_pagan'
        }
    },
    {
        id: 'vacaciones_prima',
        title: 'Vacaciones y Prima Vacacional',
        icon: 'sunny',
        description: 'Tienes derecho a días de descanso pagados que aumentan con tu antigüedad, más un pago extra del 25% sobre esos días.',
        keyInfo: [
            '12 días mínimos el primer año.',
            'Aumentan 2 días por año hasta llegar a 20.',
            'La prima vacacional es el 25% extra de tu salario diario durante las vacaciones.'
        ],
        calculatorId: 'calculadora-vacaciones',
        whatIfIDontGetIt: {
            title: '¿Y si no me dan vacaciones?',
            description: 'Las vacaciones no se pueden cambiar por dinero (salvo al terminar la relación laboral). Debes disfrutarlas.',
            relatedProblemId: 'no_me_dan_derechos'
        }
    },
    {
        id: 'ptu',
        title: 'Reparto de Utilidades (PTU)',
        icon: 'cash',
        description: 'Es tu derecho a recibir una parte de las ganancias que obtuvo la empresa el año anterior.',
        keyInfo: [
            'La empresa debe repartir el 10% de sus utilidades netas.',
            'Se paga a más tardar el 30 de mayo (empresas) o 29 de junio (patrones).',
            'Debes haber trabajado al menos 60 días en el año.'
        ],
        calculatorId: 'calculadora-ptu', // Linked to new calc
        whatIfIDontGetIt: {
            title: '¿Y si no hubo reparto?',
            description: 'Si la empresa declaró ganancias y no te pagó, puedes denunciar.',
            relatedProblemId: 'no_me_pagan'
        }
    },
    {
        id: 'prima_dominical',
        title: 'Prima Dominical',
        icon: 'calendar',
        description: 'Si trabajas ordinariamente en domingo, tienes derecho a un pago adicional.',
        keyInfo: [
            'Es un 25% extra sobre tu salario de ese día.',
            'Aplica si tu día de descanso es cualquier otro día de la semana.'
        ],
        whatIfIDontGetIt: {
            title: '¿Y si no me la pagan?',
            description: 'Revisa tus recibos de nómina. Si trabajas los domingos, este concepto debe aparecer desglosado.',
            relatedProblemId: 'no_me_pagan'
        }
    },

    // B. Prestaciones en Tiempo
    {
        id: 'dia_descanso',
        title: 'Día de Descanso Semanal',
        icon: 'beer', // Relax icon similar
        description: 'Por cada 6 días de trabajo, tienes derecho a disfrutar de un día de descanso con goce de salario íntegro.',
        keyInfo: [
            'Mínimo 1 día a la semana.',
            'Preferentemente debe ser el domingo.',
            'Si te piden trabajar tu día de descanso, deben pagarte el DOBLÉ del salario (200% extra).'
        ],
        whatIfIDontGetIt: {
            title: '¿Me obligan a trabajar sin descanso?',
            description: 'Es ilegal. Tienes derecho a tu descanso o al pago triple (salario normal + doble por el descanso trabajado).',
            relatedProblemId: 'no_me_dan_derechos'
        }
    },
    {
        id: 'dias_festivos',
        title: 'Días Festivos Obligatorios',
        icon: 'flag',
        description: 'Son días de descanso obligatorio señalados por la ley (ej. 1 de enero, 16 de septiembre, 25 de diciembre).',
        keyInfo: [
            'Si descansas, te pagan tu sueldo normal.',
            'Si trabajas, te deben pagar tu salario normal MÁS el doble (Pago Triple en total).'
        ],
        whatIfIDontGetIt: {
            title: '¿Me hicieron trabajar en festivo?',
            description: 'Debes recibir el pago triple por ese día. Revisa tu nómina.',
            relatedProblemId: 'no_me_pagan'
        }
    },
    {
        id: 'periodo_vacacional',
        title: 'Periodo Vacacional Continuo',
        icon: 'airplane',
        description: 'Tus días de vacaciones deben concederse, por lo menos, 12 días continuos.',
        keyInfo: [
            'Tú decides si quieres fraccionarlos o tomarlos juntos.',
            'La empresa no puede imponerte las fechas arbitrariamente sin acuerdo.'
        ],
        whatIfIDontGetIt: {
            title: '¿No me dejan tomar vacaciones?',
            description: 'Es tu derecho y caduca al año y medio. ¡Exígelas por escrito!',
            relatedProblemId: 'no_me_dan_derechos'
        }
    },

    // C. Seguridad y Bienestar
    {
        id: 'imss',
        title: 'Seguridad Social (IMSS)',
        icon: 'medkit',
        description: 'Tu inscripción al IMSS te da derecho a atención médica gratuita, pago de incapacidades y pensiones.',
        keyInfo: [
            'Cubre enfermedades, maternidad, riesgos de trabajo, invalidez y vejez.',
            'Protege también a tus beneficiarios (hijos, esposa/o, padres).',
            'Debes estar registrado con tu Salario Real.'
        ],
        relatedGuideId: 'checklist-imss', // Special ref
        whatIfIDontGetIt: {
            title: '¿No estás dado de alta?',
            description: 'Es un delito grave de tu patrón. Estás desprotegido ante accidentes.',
            relatedProblemId: 'no_me_dan_derechos'
        }
    },
    {
        id: 'afore',
        title: 'Ahorro para el Retiro (AFORE)',
        icon: 'trending-up',
        description: 'Es una cuenta individual donde se acumulan tus ahorros para cuando te jubiles.',
        keyInfo: [
            'El patrón aporta el 2% de tu salario base.',
            'Tú también aportas una parte.',
            'Puedes hacer aportaciones voluntarias para mejorar tu pensión.'
        ],
        whatIfIDontGetIt: {
            title: '¿No tienes Afore?',
            description: 'Si tienes IMSS, tienes Afore. Verifica en qué banco está con tu CURP.',
            relatedProblemId: 'no_me_dan_derechos'
        }
    },
    {
        id: 'infonavit',
        title: 'INFONAVIT (Vivienda)',
        icon: 'home',
        description: 'Derecho a un crédito barato para comprar, construir o mejorar tu vivienda.',
        keyInfo: [
            'El patrón aporta el 5% de tu salario (sin descontártelo).',
            'Ese dinero se acumula en tu Subcuenta de Vivienda.',
            'Necesitas 1080 puntos para pedir un crédito.'
        ],
        calculatorId: 'herramienta-consulta-infonavit', // Link to wizard tool
        relatedGuideId: 'guia-rapida-infonavit',
        whatIfIDontGetIt: {
            title: '¿Y si mi patrón no paga?',
            description: 'Te afecta para obtener tu crédito. Denúncialo ante el INFONAVIT.',
            relatedProblemId: 'no_me_dan_derechos'
        }
    }
];
