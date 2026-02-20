export interface TipoContrato {
    id: string; // ej. 'contrato-por-obra-determinada'
    title: string; // ej. 'Contrato por Obra Determinada'
    icon: string; // No necesitas generar esto, es una referencia visual.
    shortDescription: string; // Un resumen de 1-2 párrafos.
    caracteristicasClave: string[]; // Array de strings con las características principales.
    elementosRevisar: Array<{
        clause: string; // Cláusula o elemento a buscar.
        warning: string; // Advertencia o qué significa esa cláusula.
        ideal: string; // Qué debería decir o cómo debería ser.
    }>;
    derechosTrabajador: string[];
    obligacionesTrabajador: string[];
    queSucedeAlTerminar: {
        title: string;
        description: string;
        relatedProblemId?: string; // Ejemplo: 'no-me-pagan-finiquito'
    };
}

export const CONTRACT_TYPES: TipoContrato[] = [
    {
        id: 'contrato-tiempo-determinado',
        title: 'Contrato por Tiempo Determinado',
        icon: '📅', // Using emoji for now
        shortDescription: 'Es un acuerdo laboral que se establece por un tiempo específico y definido. Se utiliza cuando la naturaleza del trabajo lo requiere, como para reemplazar a un empleado, cubrir una temporada alta o para un proyecto concreto.',
        caracteristicasClave: [
            'Tiene una fecha de inicio y una fecha de fin claras.',
            'La duración máxima no puede superar los 3 años.',
            'Se debe especificar la causa o motivo por el cual se contrata por tiempo limitado.',
            'Si el trabajador sigue laborando después de la fecha de fin, el contrato se convierte en "Tiempo Indeterminado".'
        ],
        elementosRevisar: [
            {
                clause: 'Cláusula de Duración',
                warning: 'Asegúrate de que la fecha de finalización sea específica y realista.',
                ideal: 'El contrato debe indicar claramente "Este contrato surtirá efectos del [Fecha Inicio] al [Fecha Fin]".'
            },
            {
                clause: 'Causa del Contrato',
                warning: 'Verifica que se explique el motivo real del contrato temporal (ej. "suplencia por maternidad", "proyecto X").',
                ideal: 'La causa debe ser justificada y no una excusa para evitar un contrato indefinido.'
            }
        ],
        derechosTrabajador: [
            'Recibir el mismo salario y prestaciones que un trabajador permanente en un puesto similar.',
            'Derecho al pago de vacaciones, prima vacacional y aguinaldo de forma proporcional.',
            'Si el contrato se termina antes de tiempo sin causa justificada, tienes derecho a una indemnización.'
        ],
        obligacionesTrabajador: [
            'Cumplir con las horas y tareas pactadas durante el tiempo del contrato.',
            'Respetar las normas internas de la empresa.'
        ],
        queSucedeAlTerminar: {
            title: 'Al finalizar el plazo',
            description: 'El contrato termina y la relación laboral concluye. El patrón debe pagarte el finiquito, que incluye tu salario, vacaciones, prima vacacional, aguinaldo y la parte proporcional de las prestaciones.',
            relatedProblemId: 'no_me_pagan'
        }
    },
    {
        id: 'contrato-obra-determinada',
        title: 'Contrato por Obra Determinada',
        icon: '🏗️',
        shortDescription: 'Es aquel que se celebra para la realización de una labor específica (una obra, un proyecto, un desarrollo). La relación de trabajo dura únicamente el tiempo que tome completar dicha tarea.',
        caracteristicasClave: [
            'No tiene una fecha de fin exacta, sino que termina cuando se acaba la obra.',
            'Debe detallar con precisión en qué consiste la "obra" o trabajo a realizar.',
            'Solo es legal si la naturaleza del trabajo lo exige (ej. construcción, instalación de software, auditoría).',
            'Al terminar la obra, termina el contrato sin responsabilidad para el patrón (salvo pago de finiquito).'
        ],
        elementosRevisar: [
            {
                clause: 'Descripción de la Obra',
                warning: 'Si la descripción es vaga (ej. "trabajos generales"), podrían usarte para otras cosas y no acabar nunca.',
                ideal: 'Debe ser muy específica: "Construcción de barda perimetral en..." o "Desarrollo del módulo de facturación del sistema X".'
            },
            {
                clause: 'Condición de Terminación',
                warning: 'Revisa qué determina que la obra "ha terminado".',
                ideal: 'Debe ligarse a la entrega o conclusión material del trabajo pactado, no al "criterio del patrón".'
            }
        ],
        derechosTrabajador: [
            'Pago de salario hasta el último día que dure la obra.',
            'Prestaciones de ley (Seguro Social, Vacaciones, Aguinaldo) proporcionales al tiempo trabajado.',
            'Si la obra se suspende temporalmente, en algunos casos tienes derecho a pago o indemnización.',
            'Si la materia de trabajo persiste y no se acabó la obra, el contrato debe continuar.'
        ],
        obligacionesTrabajador: [
            'Realizar la obra con la calidad y en el tiempo estipulado (si hubo cronograma).',
            'Cuidar los materiales y herramientas proporcionados.',
            'Entregar la obra terminada para dar por concluida la relación.'
        ],
        queSucedeAlTerminar: {
            title: 'Al concluir la obra',
            description: 'El patrón verifica que el trabajo está hecho y la relación laboral termina legalmente. Debes recibir tu finiquito con las partes proporcionales de tus prestaciones acumuladas.',
            relatedProblemId: 'despido_injustificado'
        }
    },
    {
        id: 'contrato-tiempo-indeterminado',
        title: 'Contrato por Tiempo Indeterminado',
        icon: '♾️',
        shortDescription: 'Es el contrato más común y protector para el trabajador. No tiene una fecha de finalización establecida, por lo que la relación laboral continúa de manera permanente hasta que el trabajador renuncia, es despedido con justa causa, o ambas partes acuerdan terminarlo.',
        caracteristicasClave: [
            'No tiene una fecha de fin.',
            'Es el contrato por defecto si no se especifica lo contrario.',
            'Genera antigüedad, la cual da derecho a más vacaciones y mayores prestaciones.',
            'Ofrece mayor estabilidad laboral.'
        ],
        elementosRevisar: [
            {
                clause: 'Fecha de Finalización',
                warning: '¡Cuidado! Si tu contrato es "indeterminado", no debería tener una fecha de fin. Si la tiene, podría ser un contrato temporal disfrazado.',
                ideal: 'El contrato debe especificar que es "por tiempo indeterminado" y omitir cualquier cláusula de vencimiento.'
            },
            {
                clause: 'Cláusulas de Renuncia',
                warning: 'Nunca firmes un contrato en blanco o con cláusulas donde renuncias a tus derechos (vacaciones, aguinaldo, indemnización, etc.). Esas cláusulas son nulas.',
                ideal: 'El contrato no debe contener renuncias de derechos. Si las hay, son inválidas y puedes impugnarlas.'
            }
        ],
        derechosTrabajador: [
            'Estabilidad laboral y antigüedad.',
            'Derecho a una prima de antigüedad en caso de despido injustificado o renuncia voluntaria después de 15 años.',
            'Acceso a mejores prestaciones conforme crece tu antigüedad (ej. más días de vacaciones).',
            'Derecho a una indemnización si eres despedido sin causa justificada.'
        ],
        obligacionesTrabajador: [
            'Realizar las labores encomendadas con diligencia y esmero.',
            'Asistir puntualmente al trabajo.',
            'Observar las medidas de seguridad e higiene establecidas.',
            'Respetar el reglamento interior de trabajo.'
        ],
        queSucedeAlTerminar: {
            title: 'Si termina la relación laboral',
            description: 'Puede terminar por renuncia voluntaria del trabajador, por despido (con o sin justa causa) o por mutuo acuerdo. En cada caso, el patrón tiene la obligación de liquidarte y pagarte el finiquito correspondiente. Si te despiden sin causa, tienes derecho a una indemnización.',
            relatedProblemId: 'despido_injustificado'
        }
    },
    {
        id: 'contrato-de-prueba',
        title: 'Contrato de Prueba',
        icon: '🧪',
        shortDescription: 'Es un periodo al inicio de una relación laboral (generalmente dentro de un contrato indeterminado) que permite al patrón evaluar las habilidades del trabajador. No es un contrato separado, sino una cláusula dentro de tu contrato principal.',
        caracteristicasClave: [
            'Duración máxima de 30 días (puede ser de hasta 90 para puestos de dirección).',
            'El trabajador tiene TODOS los derechos laborales desde el primer día (IMSS, vacaciones, etc.).',
            'No se puede usar para evadir responsabilidades patronales.',
            'Si el trabajador no es aceptado, el patrón debe pagarle la indemnización correspondiente.'
        ],
        elementosRevisar: [
            {
                clause: 'Duración del Período',
                warning: 'Verifica que la duración no exceda los 30 días (o 90 para puestos de dirección). Un período más largo es ilegal.',
                ideal: 'El contrato debe decir: "El presente contrato estará sujeto a un período de prueba de 30 días contados a partir de [Fecha de inicio]".'
            },
            {
                clause: 'Derechos Laborales',
                warning: 'Si te dicen que durante el período de prueba no tienes derecho a IMSS, vacaciones o aguinaldo, es FALSO. Es una práctica ilegal.',
                ideal: 'Tu contrato debe establecer que estás inscrito en el IMSS desde el día 1 y que todos tus derechos son plenos, sin importar el período de prueba.'
            }
        ],
        derechosTrabajador: [
            'Recibir tu salario completo y puntual.',
            'Estar inscrito en el IMSS desde el primer día.',
            'Disfrutar de todas las prestaciones de ley (vacaciones, aguinaldo, reparto de utilidades).',
            'Si eres despedido durante este periodo sin justa causa, tienes derecho a una indemnización.'
        ],
        obligacionesTrabajador: [
            'Demostrar las habilidades y aptitudes para el puesto.',
            'Cumplir con las labores y el reglamento interior de trabajo.'
        ],
        queSucedeAlTerminar: {
            title: 'Al finalizar el período',
            description: 'Si el patrón decide no contratarte, debe darte aviso por escrito con una causa justificada y pagarte una indemnización (3 meses de salario más 20 días por cada año trabajado). Si no hay causa, la indemnización es mayor. Si decides no continuar, solo debes dar aviso.',
            relatedProblemId: 'despido_injustificado'
        }
    },
    {
        id: 'modalidad-teletrabajo',
        title: 'Modalidad de Teletrabajo (Home Office)',
        icon: '🏠',
        shortDescription: 'No es un tipo de contrato, sino una modalidad que se puede añadir a cualquier contrato (generalmente al indeterminado). Se aplica cuando el trabajador realiza más del 40% de su jornada laboral desde un lugar distinto al centro de trabajo.',
        caracteristicasClave: [
            'Se realiza fuera de las instalaciones del patrón (más del 40% del tiempo).',
            'El patrón está obligado a proporcionar las herramientas de trabajo (computadora, silla, etc.).',
            'El patrón debe asumir los costos derivados del trabajo (proporcional de internet, electricidad).',
            'El trabajador tiene derecho a la desconexión al terminar su jornada.'
        ],
        elementosRevisar: [
            {
                clause: 'Herramientas de Trabajo',
                warning: 'El patrón no puede obligarte a usar tu propia computadora, silla o equipo de trabajo. Debe proporcionártelo.',
                ideal: 'El contrato o un anexo debe especificar qué equipo te será entregado y quién es responsable de su instalación y mantenimiento.'
            },
            {
                clause: 'Pago de Gastos',
                warning: 'Si teletrabajas, el patrón debe pagarte una parte de tu recibo de luz y de internet. Si te niegan, es un incumplimiento.',
                ideal: 'El contrato debe establecer un mecanismo para el pago de estos gastos, como un monto fijo mensual o el reembolso con comprobantes.'
            },
            {
                clause: 'Derecho a la Desconexión',
                warning: 'No estás obligado a contestar correos, llamadas o mensajes fuera de tu horario laboral.',
                ideal: 'El contrato debe respetar tu jornada de trabajo y tu derecho a desconectarte, garantizando tu tiempo libre.'
            }
        ],
        derechosTrabajador: [
            'A que el patrón proporcione, instale y dé mantenimiento al equipo necesario.',
            'A recibir el pago proporcional de los servicios de internet y electricidad.',
            'A la desconexión fuera de tu horario laboral.',
            'A ser tratado con la misma dignidad y tener los mismos derechos que un trabajador presencial.'
        ],
        obligacionesTrabajador: [
            'Cuidar y usar correctamente el equipo proporcionado por la empresa.',
            'Cumplir con tu jornada laboral y las metas acordadas.',
            'Informar al patrón sobre cualquier accidente o enfermedad relacionada con el teletrabajo.'
        ],
        queSucedeAlTerminar: {
            title: 'Si termina la relación laboral',
            description: 'Si el contrato principal (indeterminado, etc.) termina, se aplican las mismas reglas que para cualquier otro trabajador (finiquito, indemnización si corresponde). Además, tienes la obligación de devolver todo el equipo que te fue proporcionado.',
            relatedProblemId: 'no_me_pagan'
        }
    }
];
