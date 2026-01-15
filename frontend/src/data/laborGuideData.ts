export const CONTRACT_TYPES = [
    {
        id: '1',
        title: 'Contrato a Plazo Indeterminado',
        description: 'Es el contrato estándar. Tiene fecha de inicio pero no de fin. Te da estabilidad laboral completa.',
        details: 'Solo pueden despedirte por causa justa o falta grave. Tienes todos los derechos de ley desde el primer día.'
    },
    {
        id: '2',
        title: 'Contrato a Plazo Fijo (Determinado)',
        description: 'Tiene fecha de inicio y fin. Se usa por necesidades específicas de la empresa.',
        details: 'Debe estar justificado por escrito (ej. suplencia, incremento de actividad). Si se renueva por más de 5 años, se vuelve indeterminado.'
    },
    {
        id: '3',
        title: 'Contrato por Obra o Servicio',
        description: 'Dura lo que tarde en terminarse una obra o servicio específico.',
        details: 'Acaba cuando el proyecto termina. Tienes derecho a beneficios sociales proporcionales al tiempo trabajado.'
    },
    {
        id: '4',
        title: 'Contrato a Tiempo Parcial (Part-time)',
        description: 'Jornada menor a 4 horas diarias en promedio.',
        details: 'Tienen derechos limitados: Vacaciones (6 días), Gratificaciones y Seguro Social. No tienen CTS ni protección contra despido arbitrario.'
    }
];

export const WORKER_RIGHTS = [
    {
        id: '1',
        title: 'Jornada de Trabajo',
        description: 'Máximo 8 horas diarias o 48 semanales.',
        icon: 'time-outline'
    },
    {
        id: '2',
        title: 'Descanso Semanal',
        description: 'Mínimo 24 horas consecutivas de descanso (preferiblemente domingos).',
        icon: 'calendar-outline'
    },
    {
        id: '3',
        title: 'Vacaciones',
        description: '30 días de descanso remunerado por cada año completo de servicios.',
        icon: 'airplane-outline'
    },
    {
        id: '4',
        title: 'Seguridad Social',
        description: 'Derecho a estar asegurado en ESSALUD (pagado por el empleador) y un sistema de pensiones (ONP/AFP).',
        icon: 'medkit-outline'
    }
];

export const CHEST_ITEMS = [
    {
        id: 'cvs',
        title: 'Ejemplos de Currículum (CV)',
        description: 'Plantillas modernas listas para descargar.',
        icon: 'document-text-outline',
        items: [
            { id: 'cv1', name: 'CV Básico (1 página)' },
            { id: 'cv2', name: 'CV Profesional' },
            { id: 'cv3', name: 'CV Creativo' },
            { id: 'cv4', name: 'CV sin experiencia' }
        ]
    },
    {
        id: 'letters',
        title: 'Cartas de Solicitud',
        description: 'Modelos para comunicarte formalmente.',
        icon: 'mail-outline',
        items: [
            { id: 'l1', name: 'Solicitud de vacaciones' },
            { id: 'l2', name: 'Solicitud de constancia laboral' },
            { id: 'l3', name: 'Solicitud de pago pendiente' },
            { id: 'l4', name: 'Solicitud de finiquito' }
        ]
    },
    {
        id: 'docs',
        title: 'Documentos de Apoyo',
        description: 'Guías para entender documentos importantes.',
        icon: 'folder-open-outline',
        note: 'Estos documentos son solo referenciales y no tienen validez legal.',
        items: [
            { id: 'd1', name: 'Ejemplo de Contrato Individual' },
            { id: 'd2', name: 'Ejemplo de Recibo de Pago' },
            { id: 'd3', name: 'Ejemplo de Comprobante de Horas Extra' }
        ]
    },
    {
        id: 'guides',
        title: 'Guías Rápidas Imprimibles',
        description: 'Tarjetas de bolsillo para resolver dudas.',
        icon: 'print-outline',
        items: [
            { id: 'g1', name: 'Checklist antes de renunciar' },
            { id: 'g2', name: 'Qué hacer si me despiden' },
            { id: 'g3', name: 'Derechos básicos del trabajador' }
        ]
    }
];

export const LAW_BENEFITS = [
    {
        id: 'cts',
        title: 'CTS',
        subtitle: 'Compensación por Tiempo de Servicios',
        description: 'Es como un seguro de desempleo. Se deposita dos veces al año (Mayo y Noviembre). equivale aprox. a un sueldo al año.',
        icon: 'cash-outline',
        color: '#2ecc71'
    },
    {
        id: 'vacaciones',
        title: 'Vacaciones',
        subtitle: 'Descanso Remunerado',
        description: 'Tienes derecho a 30 días calendario de descanso físico por cada año trabajado. Puedes vender hasta 15 días.',
        icon: 'sunny-outline',
        color: '#f1c40f'
    },
    {
        id: 'grati',
        title: 'Gratificaciones',
        subtitle: 'Fiestas Patrias y Navidad',
        description: 'Percibes un sueldo extra en Julio y otro en Diciembre. No están sujetas a descuentos (salvo 5ta categoría).',
        icon: 'gift-outline',
        color: '#e74c3c'
    },
    {
        id: 'seguro',
        title: 'Seguridad Social',
        subtitle: 'AFP u ONP',
        description: 'Debes elegir un sistema de pensiones. ONP es público (fondo común) y AFP es privado (cuenta individual).',
        icon: 'shield-checkmark-outline',
        color: '#3498db'
    },
    {
        id: 'salud',
        title: 'Salud',
        subtitle: 'ESSALUD / EPS',
        description: 'Tu empleador paga el 9% de tu sueldo a ESSALUD. Puedes optar por una EPS para atención privada (con copago).',
        icon: 'fitness-outline',
        color: '#9b59b6'
    }
];
