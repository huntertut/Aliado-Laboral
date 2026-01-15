// Modelo de datos para Problemas Comunes
export interface ProblemaComun {
    id: string;
    title: string;
    icon: string | { type: 'emoji' | 'image'; value: string };
    description: string;
    howToKnowTitle: string;
    howToKnowPoints: string[];
    whatToDoTitle: string;
    whatToDoPoints: Array<{ action: string; detail: string }>;
    nextStepsTitle: string;
    nextSteps: Array<{ action: string; detail: string; targetModule: string }>;
}

export const COMMON_PROBLEMS: ProblemaComun[] = [
    {
        id: 'despido_injustificado',
        title: 'Despido Injustificado',
        icon: '🔴',
        description: 'Es cuando tu empleador termina tu relación laboral sin una causa justificada, sin notificarte por escrito o sin pagarte las indemnizaciones que la ley establece.',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿Te despidieron sin darte una razón clara y por escrito?',
            '¿Te acusaron de algo que no hiciste sin pruebas?',
            '¿Te despidieron por estar embarazada, por tu edad, por tu orientación sexual o por alguna otra discriminación?',
            '¿Te ofrecieron "renunciar voluntariamente" a cambio de un pago que parece muy bajo?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'NO firmes tu renuncia', detail: 'ni ningún documento (finiquito, recibo) sin entenderlo bien.' },
            { action: 'Pide por escrito', detail: 'tu finiquito y tus documentos de trabajo (constancias, etc.).' },
            { action: 'Guarda pruebas', detail: '(correos, mensajes de WhatsApp, grabaciones, testigos).' },
            { action: 'Tienes 2 meses', detail: 'para iniciar un juicio. ¡No dejes pasar el tiempo!' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Calcula tu finiquito', detail: 'con nuestra herramienta para saber cuánto te deben.', targetModule: 'Calculator' },
            { action: 'Contacta a un abogado', detail: 'para evaluar tu caso y defender tus derechos.', targetModule: 'Lawyers' }
        ]
    },
    {
        id: 'no_me_pagan',
        title: 'No me pagan (horas extra, salario, prestaciones)',
        icon: '💸',
        description: 'Cuando tu empleador no te paga tu salario completo, las horas extra que trabajaste, o te niega prestaciones como vacaciones, reparto de utilidades (PTU) o aguinaldo.',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿Tu recibo de nómina no coincide con las horas que trabajaste?',
            '¿Trabajas horas extras y no te pagan el 100% extra?',
            '¿No te han dado tus vacaciones de ley o te las pagan sin el prima vacacional?',
            '¿No te han pagado el aguinaldo o la PTU correspondiente?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'Guarda tus recibos de nómina', detail: 'y cualquier comprobante de tus horas de trabajo.' },
            { action: 'Anota tus horas extra', detail: 'en una libreta o en tu celular, con fecha y hora.' },
            { action: 'Solicita un estado de cuenta', detail: 'de tus prestaciones por escrito a Recursos Humanos.' },
            { action: 'No renuncies', detail: 'por esta causa, podrías perder el derecho a una indemnización.' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Usa nuestra Calculadora', detail: 'para saber cuánto te deben.', targetModule: 'Calculator' },
            { action: 'Revisa tus Prestaciones de Ley', detail: 'para conocer tus derechos.', targetModule: 'Benefits' }
        ]
    },
    {
        id: 'acoso_laboral',
        title: 'Acoso Laboral (Mobbing)',
        icon: { type: 'image', value: require('../assets/images/mobbing.jpg') },
        description: 'Es el comportamiento hostil, ofensivo o intimidatorio que se repite de forma sistemática por parte de jefes o compañeros, creando un ambiente de trabajo humillante y dañino para tu dignidad.',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿Te ignoran, te aíslan o te asignan tareas humillantes constantemente?',
            '¿Recibes críticas injustificadas y públicas sobre tu trabajo?',
            '¿Te hacen chistes o comentarios ofensivos sobre tu persona?',
            '¿Difunden rumores falsos para dañar tu reputación en la empresa?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'Documenta cada incidente', detail: 'con fecha, hora, descripción y testigos (si los hay).' },
            { action: 'Guarda pruebas', detail: '(correos, mensajes, notas, etc.).' },
            { action: 'Informa a Recursos Humanos', detail: 'por escrito, si te sientes seguro de hacerlo.' },
            { action: 'Busca apoyo psicológico', detail: 'tu salud es la prioridad.' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Consulta la NOM-035', detail: 'sobre Factores de Riesgo Psicosocial.', targetModule: 'ImssNom' },
            { action: 'Habla con un abogado', detail: 'especializado en acoso laboral.', targetModule: 'Lawyers' }
        ]
    },
    {
        id: 'ciberacoso_laboral',
        title: 'Ciberacoso Laboral',
        icon: { type: 'image', value: require('../assets/images/ciberacoso.jpg') },
        description: 'Es el acoso, hostigamiento, humillación o amenaza que sufres a través de medios digitales como WhatsApp, correo electrónico, redes sociales o cualquier plataforma online, por parte de un jefe, compañero o incluso la empresa.',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿Te envían mensajes ofensivos, insultantes o amenazantes fuera de tu horario laboral?',
            '¿Publican fotos, videos o información tuya para ridiculizarte o dañar tu reputación?',
            '¿Te han excluido de grupos de trabajo importantes en WhatsApp o Slack sin justificación?',
            '¿Usan el email de la empresa para difundir rumores falsos sobre ti?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'NO BORRES NADA', detail: 'Haz capturas de pantalla de todo: mensajes, publicaciones, correos.' },
            { action: 'Bloquea al agresor', detail: 'en redes sociales y WhatsApp, pero solo DESPUÉS de haber guardado las pruebas.' },
            { action: 'Informa a Recursos Humanos', detail: 'por escrito (envía un email), describiendo los hechos y adjuntando las pruebas.' },
            { action: 'Busca apoyo', detail: 'Habla con alguien de confianza o un profesional. Tu salud mental es lo primero.' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Reúne todas tus pruebas digitales', detail: 'en una carpeta.', targetModule: 'MyChest' },
            { action: 'Habla con un abogado', detail: 'especializado en derecho digital y laboral.', targetModule: 'Lawyers' }
        ]
    },
    {
        id: 'no_me_dan_derechos',
        title: 'No me dan mis derechos (IMSS, vacaciones, etc.)',
        icon: '📄',
        description: 'Cuando tu empleador no cumple con sus obligaciones legales de inscribirte en el IMSS, darte tus vacaciones, pagar tu aguinaldo o repartir utilidades (PTU).',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿No tienes tu número de afiliación al IMSS o no apareces en su app?',
            '¿Llevas más de un año trabajando y nunca te has ido de vacaciones?',
            '¿No te han entregado tu aguinaldo antes del 20 de diciembre?',
            '¿La empresa reparte utilidades y tú no recibiste nada?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'Solicita tu constancia de trabajo', detail: 'y tus comprobantes de inscripción en el IMSS.' },
            { action: 'Revisa tus recibos de nómina', detail: 'para ver si están realizando las deducciones correctas.' },
            { action: 'Presenta un escrito libre', detail: 'en la oficina del IMSS más cercana para verificar tu inscripción.' },
            { action: 'Guarda todos tus comprobables', detail: 'de trabajo (contratos, correos, etc.).' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Usa nuestra Calculadora', detail: 'para saber cuánto te deben.', targetModule: 'Calculator' },
            { action: 'Genera una carta de solicitud', detail: 'en "Mi Baúl" para exigir tus derechos.', targetModule: 'MyChest' }
        ]
    },
    {
        id: 'presion_firmar',
        title: 'Presión para firmar (renuncia, finiquito)',
        icon: '✍️',
        description: 'Cuando tu empleador te presiona, engaña o coacciona para que firmes una renuncia voluntaria, un finiquito o un recibo de pago con montos inferiores a los que legalmente te corresponden.',
        howToKnowTitle: '¿Cómo saber si es tu caso?',
        howToKnowPoints: [
            '¿Te dicen que si no firmas "la renuncia", no te darán tu último pago?',
            '¿Te ofrecen un "acuerdo rápido" si renuncias, pero el dinero es muy bajo?',
            '¿Te presionan para que firmes un documento "de confianza" sin dejarte leerlo con calma?',
            '¿Te amenazan con demandarte o dañar tu reputación si no firmas?'
        ],
        whatToDoTitle: '¿Qué hacer AHORA? (Pasos Inmediatos)',
        whatToDoPoints: [
            { action: 'NO firmes NADA', detail: 'a la que te presionen. Tienes derecho a leerlo y entenderlo.' },
            { action: 'Pide una copia del documento', detail: 'antes de firmarlo para poder analizarlo.' },
            { action: 'Graba la conversación', detail: 'si te sientes seguro, como prueba de la presión.' },
            { action: 'Retírate del lugar', detail: 'si la situación es muy hostil. No tienes que firmar en ese momento.' }
        ],
        nextStepsTitle: 'Tu Siguiente Paso en la App',
        nextSteps: [
            { action: 'Calcula tu finiquito real', detail: 'con nuestra herramienta para comparar.', targetModule: 'Calculator' },
            { action: 'Contacta a un abogado', detail: 'antes de firmar cualquier documento.', targetModule: 'Lawyers' }
        ]
    }
];
