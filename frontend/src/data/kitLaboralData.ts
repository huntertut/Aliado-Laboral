export const CV_EXAMPLES = [
    {
        id: "cv-basico-01",
        title: "CV Básico",
        category: "CV",
        description: "Un formato simple y directo, ideal para empezar o para roles tradicionales.",
        isPremium: false,
        content: {
            header: {
                name: "[Nombre Completo]",
                contact: {
                    phone: "[Tu Teléfono]",
                    email: "[Tu Email]",
                    location: "[Tu Ciudad, Estado]",
                    linkedin: "[URL de tu LinkedIn (Opcional)]"
                }
            },
            sections: [
                {
                    title: "Objetivo Profesional",
                    items: ["Busco una posición como [Nombre del Puesto] donde pueda aplicar mis habilidades en [Habilidad 1] y [Habilidad 2] para contribuir al crecimiento de la empresa."]
                },
                {
                    title: "Experiencia Laboral",
                    items: [
                        {
                            position: "[Tu Puesto Anterior]",
                            company: "[Nombre de la Empresa]",
                            date: "[Mes Año] – [Mes Año]",
                            responsibilities: [
                                "Responsabilidad principal que desempeñabas.",
                                "Otra tarea importante.",
                                "Logro cuantificable (ej: 'Atendí a más de 50 clientes diarios')."
                            ]
                        }
                    ]
                },
                {
                    title: "Educación",
                    items: [
                        {
                            degree: "[Nombre de tu Carrera o Certificado]",
                            institution: "[Nombre de la Escuela]",
                            date: "[Año de conclusión]"
                        }
                    ]
                },
                {
                    title: "Habilidades",
                    items: [
                        "Habilidad técnica 1 (ej: Microsoft Office)",
                        "Habilidad técnica 2 (ej: SAP)",
                        "Habilidad blanda 1 (ej: Trabajo en equipo)",
                        "Habilidad blanda 2 (ej: Comunicación)"
                    ]
                }
            ]
        }
    },
    {
        id: "cv-sin-experiencia-01",
        title: "CV Sin Experiencia",
        category: "CV",
        description: "Enfocado en tus habilidades, estudios y proyectos para destacar tu potencial.",
        isPremium: false,
        content: {
            header: {
                name: "[Nombre Completo]",
                contact: {
                    phone: "[Tu Teléfono]",
                    email: "[Tu Email]",
                    location: "[Tu Ciudad, Estado]"
                }
            },
            sections: [
                {
                    title: "Resumen",
                    items: ["Estudiante proactivo y responsable de [Carrera] con habilidades en [Habilidad 1] y [Habilidad 2]. Busco mi primera oportunidad profesional para aplicar mis conocimientos y desarrollar nuevas competencias en [Área de Interés]."]
                },
                {
                    title: "Educación",
                    items: [
                        {
                            degree: "[Nombre de tu Carrera]",
                            institution: "[Nombre de la Universidad]",
                            date: "[Año de inicio] – [Año de conclusión o actual]",
                            details: "Materias relevantes: [Materia 1], [Materia 2]."
                        }
                    ]
                },
                {
                    title: "Proyectos Académicos o Personales",
                    items: [
                        {
                            projectName: "[Nombre del Proyecto]",
                            description: "Breve descripción del proyecto y el objetivo.",
                            technologies: "Herramientas o tecnologías usadas (ej: Excel, Canva, Python)."
                        }
                    ]
                },
                {
                    title: "Habilidades",
                    items: [
                        "**Idiomas:** [Idioma] (Nivel: Básico/Intermedio/Avanzado)",
                        "**Software:** [Software 1], [Software 2]",
                        "**Habilidades Blandas:** Liderazgo, Resolución de problemas, Creatividad."
                    ]
                }
            ]
        }
    },
    {
        id: "cv-profesional-01",
        title: "CV Profesional",
        category: "CV",
        description: "Diseñado para destacar tus logros cuantificables y tu trayectoria de crecimiento.",
        isPremium: true,
        content: {
            header: {
                name: "[Nombre Completo]",
                title: "[Tu Título Profesional o Cargo Actual]",
                contact: {
                    phone: "[Tu Teléfono]",
                    email: "[Tu Email Profesional]",
                    linkedin: "[URL de tu LinkedIn]",
                    location: "[Tu Ciudad, Estado]"
                }
            },
            sections: [
                {
                    title: "Perfil Profesional",
                    items: ["Profesional con [Número] años de experiencia en [Tu Industria], especializado en [Área de Especialidad]. Demostrada capacidad para [Logro Principal 1] y [Logro Principal 2], resultando en [Resultado Cuantificable, ej: un aumento del 15% en la eficiencia]. Busco una posición desafiante donde pueda liderar proyectos estratégicos."]
                },
                {
                    title: "Experiencia Profesional",
                    items: [
                        {
                            position: "[Tu Puesto Más Reciente]",
                            company: "[Nombre de la Empresa]",
                            date: "[Mes Año] – Presente",
                            achievements: [
                                "Incrementé [Métrica] en un [Porcentaje]% en [Periodo] al implementar [Estrategia].",
                                "Lideré un equipo de [Número] personas para el proyecto [Nombre del Proyecto], cumpliendo los objetivos antes de la fecha límite.",
                                "Reducí costos operativos en [Cantidad] al optimizar el proceso de [Proceso]."
                            ]
                        }
                    ]
                },
                {
                    title: "Educación y Certificaciones",
                    items: [
                        {
                            degree: "[Nombre de tu Carrera o Posgrado]",
                            institution: "[Nombre de la Institución]",
                            date: "[Año]"
                        },
                        {
                            certification: "[Nombre de la Certificación]",
                            institution: "[Institución que la emite]",
                            date: "[Año]"
                        }
                    ]
                },
                {
                    title: "Competencias Clave",
                    items: [
                        "**Estratégicas:** Planificación, Análisis de Negocios, Gestión de Proyectos.",
                        "**Técnicas:** [Software Avanzado 1], [Herramienta Técnica 2].",
                        "**Interpersonales:** Negociación, Liderazgo, Comunicación Asertiva."
                    ]
                }
            ]
        }
    },
    {
        id: "cv-creativo-01",
        title: "CV Creativo",
        category: "CV",
        description: "Un diseño visualmente atractivo que prioriza tu portafolio y habilidades creativas.",
        isPremium: true,
        content: {
            header: {
                name: "[Nombre Completo]",
                title: "[Tu Título Creativo, ej: Diseñador Gráfico]",
                contact: {
                    phone: "[Tu Teléfono]",
                    email: "[Tu Email Creativo]",
                    portfolio: "[URL a tu Portafolio Online - ¡MUY IMPORTANTE!]",
                    "behance/dribbble": "[URL a tu perfil en redes creativas]"
                }
            },
            sections: [
                {
                    title: "Sobre Mí",
                    items: ["[Párrafo breve y con personalidad sobre tu pasión por la creatividad, tu estilo y el tipo de proyectos que te emocionan. Menciona 2-3 de tus habilidades más fuertes.]"]
                },
                {
                    title: "Proyectos Destacados",
                    items: [
                        {
                            projectName: "[Nombre del Proyecto 1]",
                            role: "Tu rol en el proyecto (ej: Diseñador Principal, Ilustrador)",
                            description: "El objetivo del proyecto y tu enfoque creativo.",
                            tools: "Herramientas utilizadas (ej: Adobe Illustrator, Figma, Blender).",
                            link: "Enlace para ver el proyecto online."
                        }
                    ]
                },
                {
                    title: "Experiencia",
                    items: [
                        {
                            position: "[Tu Puesto]",
                            company: "[Nombre de la Agencia o Empresa]",
                            date: "[Año] – [Año]",
                            description: "Breve descripción de tus responsabilidades y los tipos de clientes o marcas con las que trabajaste."
                        }
                    ]
                },
                {
                    title: "Herramientas y Habilidades",
                    items: [
                        "**Diseño:** Adobe Creative Suite (Photoshop, Illustrator, InDesign), Figma, Sketch.",
                        "**Animación 3D:** Blender, Cinema 4D.",
                        "**Otras:** Fotografía, Edición de Video, Copywriting."
                    ]
                }
            ]
        }
    },
    // SECTION: LETTERS
    {
        id: "carta-vacaciones-01",
        title: "Solicitud de Vacaciones",
        category: "LETTER",
        description: "Un modelo formal para solicitar los días de vacaciones que te corresponden.",
        isPremium: false,
        content: {
            asunto: "Solicitud de Vacaciones",
            destinatario: "[Nombre del Jefe o Recursos Humanos]",
            cuerpo: "Por medio de la presente, yo, [Tu Nombre Completo], con puesto de [Tu Puesto], solicito formalmente el disfrute de mis días de vacaciones correspondientes al periodo [Año de las vacaciones].\n\nDeseo gozar de [Número] días de vacaciones, a partir del día [Fecha de Inicio] hasta el [Fecha de Fin].\n\nAgradezco de antemano su atención y quedo a su disposición para coordinar la entrega de mis responsabilidades durante mi ausencia.\n\nSin otro particular por el momento, le saludo atentamente.",
            despedida: "Atentamente,\n\n[Tu Nombre Completo]\n[Tu Puesto]\n[Tu Teléfono]"
        }
    },
    {
        id: "carta-constancia-01",
        title: "Solicitud de Constancia de Trabajo",
        category: "LETTER",
        description: "Para solicitar formalmente un documento que acredite tu empleo en la empresa.",
        isPremium: false,
        content: {
            asunto: "Solicitud de Constancia de Trabajo",
            destinatario: "Departamento de Recursos Humanos",
            cuerpo: "Quien suscribe, [Tu Nombre Completo], con número de empleado [Tu Número de Empleado, si lo tienes], solicito respetuosamente se me expida una constancia de trabajo.\n\nEste documento lo requiero para [Motivo, ej: tramitar un crédito, un trámite bancario, etc.].\n\nAgradecería que la constancia incluya los siguientes datos:\n- Fecha de ingreso a la empresa.\n- Puesto actual.\n- Antigüedad en el puesto.\n- Salario o sueldo.\n\nQuedo a su disposición para cualquier información adicional que necesiten.\n\nGracias por su atención.",
            despedida: "Saludos cordiales,\n\n[Tu Nombre Completo]\n[Tu Puesto]\n[Tu Contacto]"
        }
    },
    {
        id: "carta-pago-pendiente-01",
        title: "Aviso de Pago Pendiente",
        category: "LETTER",
        description: "Un recordatorio formal y amable para un pago que no se ha realizado.",
        isPremium: false,
        content: {
            asunto: "Acerca del pago pendiente correspondiente a [Periodo de Pago, ej: quincena del 1 al 15 de Mayo]",
            destinatario: "[Nombre del Jefe o Recursos Humanos]",
            cuerpo: "Hola, [Nombre del Jefe/Contacto de RH].\n\nEspero que te encuentres muy bien.\n\nTe escribo para dar seguimiento amable a mi pago correspondiente al periodo [Periodo de Pago]. Revisé mi estado de cuenta y al día de hoy no lo he recibido.\n\nPodrías, por favor, ayudarme a verificar el estatus de este depósito? Cualquier información que necesites de mi parte, estoy a tu disposición.\n\nAgradezco mucho tu tiempo y tu gestión.\n\nSaludos.",
            despedida: "Atentamente,\n\n[Tu Nombre Completo]\n[Tu Puesto]"
        }
    },
    {
        id: "carta-finiquito-01",
        title: "Solicitud de Liquidación y Finiquito",
        category: "LETTER",
        description: "Una carta formal para solicitar el pago de todas tus prestaciones al finalizar la relación laboral.",
        isPremium: false,
        content: {
            asunto: "Solicitud de Pago de Liquidación y Finiquito",
            destinatario: "[Nombre del Jefe o Recursos Humanos]",
            cuerpo: "Por medio de este escrito, yo, [Tu Nombre Completo], con puesto de [Tu Puesto], hago constar que mi relación laboral con esta empresa terminó el día [Fecha de tu último día].\n\nEn base a lo estipulado por la Ley Federal del Trabajo, solicito formalmente se me realice el pago de mi liquidación y finiquito en un plazo no mayor a 7 días naturales, conforme a lo siguiente:\n\n- **Salario pendiente:** Correspondiente a los días [Número de días] trabajados del último periodo.\n- **Vacaciones disfrutadas y prima vacacional:** [Número] días de vacaciones y el 25% correspondiente.\n- **Vacaciones no disfrutadas:** [Número] días de vacaciones proporcionales por antigüedad.\n- **Aguinaldo proporcional:** Correspondiente a los días trabajados en el año.\n- **Prima dominical (si aplica):** Correspondiente a los domingos laborados.\n- **Cualquier otra prestación:** [Menciona otras prestaciones si aplica, ej: PTU].\n\nQuedo a su disposición para agendar una cita y firmar el finiquito en cuanto esté listo el cálculo y el pago.\n\nAgradezco su pronta atención a este asunto.",
            despedida: "Atentamente,\n\n[Tu Nombre Completo]\n[Tu Dirección]\n[Tu Teléfono]\n[Tu Email]"
        }
    },
    // SECTION: SUPPORT DOCUMENTS
    {
        id: "doc-apoyo-contrato-01",
        title: "Guía para Revisar tu Contrato de Trabajo",
        category: "SUPPORT",
        description: "Aprende a identificar las cláusulas más importantes y a detectar las que violan tus derechos.",
        isPremium: false,
        visualAsset: 'CONTRACT_GUIDE',
        content: {
            queEs: "El contrato de trabajo es el documento que establece las reglas entre tú y tu patrón. Firmarlo no significa que renuncies a tus derechos.",
            queRevisar: [
                {
                    clausula: "Tipo de Contrato",
                    descripcion: "Debe especificar si es por tiempo indeterminado, determinado, por obra, etc.",
                    ejemplo: "El presente contrato es por tiempo indeterminado a partir del [Fecha].",
                    alerta: "Si tu contrato es 'determinado' pero no tiene una fecha de fin clara o una causa justificada, podría ser una simulación para evitar darte estabilidad."
                },
                {
                    clausula: "Jornada de Trabajo",
                    descripcion: "Debe especificar tus horas de trabajo, días de descanso y los horarios.",
                    ejemplo: "Jornada de 8 horas diarias, de lunes a viernes de 9:00 a.m. a 6:00 p.m., con una hora de comida. Días de descanso: sábado y domingo.",
                    alerta: "Cuidado con cláusulas que te obliguen a trabajar horas extra sin pago o que no respeten tu día de descanso obligatorio."
                },
                {
                    clausula: "Salario",
                    descripcion: "Debe especificar tu salario neto (lo que recibes) y las prestaciones.",
                    ejemplo: "Salario mensual de $[Cantidad] MXN, pagadero por quincena vencida. Se otorgan todas las prestaciones de ley (vacaciones, aguinaldo, PTU, etc.).",
                    alerta: "Nunca firmes un contrato donde se te pida renunciar a las prestaciones de ley. Esas cláusulas son nulas."
                }
            ],
            fileUrl: "https://firebasestorage.googleapis.com/.../ejemplo_contrato_indeterminado.pdf"
        }
    },
    {
        id: "doc-apoyo-recibo-01",
        title: "Guía para Entender tu Recibo de Nómina",
        category: "SUPPORT",
        description: "Descubre qué significan las siglas y los números en tu recibo de pago para asegurarte de que todo está correcto.",
        isPremium: false,
        visualAsset: 'PAYSLIP_GUIDE',
        content: {
            queEs: "El recibo de pago (CFDI de nómina) es el comprobante oficial de que tu patrón te pagó y de las deducciones que se hicieron.",
            desglose: [
                {
                    seccion: "Percepciones",
                    descripcion: "Es todo el dinero que GANAS.",
                    conceptos: {
                        "Sueldo": "Tu pago base por tus horas de trabajo.",
                        "Horas Extra": "Pago extra por trabajar más de tu jornada. Debe estar desglosado.",
                        "Vacaciones": "El pago correspondiente a los días de vacaciones que disfrutaste.",
                        "Prima Vacacional": "El 25% extra sobre el pago de tus vacaciones.",
                        "Aguinaldo": "El pago de tu bono de fin de año.",
                        "PTU": "La participación de las utilidades de la empresa."
                    }
                },
                {
                    seccion: "Deducciones",
                    descripcion: "Es el dinero que se DESCUENTA de tu sueldo por ley.",
                    conceptos: {
                        "IMSS (Seguridad Social)": "Tu aportación y la de tu patrón para servicios médicos.",
                        "ISR (Impuesto Sobre la Renta)": "Impuesto que se calcula sobre tus ingresos.",
                        "AFORE (Retiro)": "Tu ahorro para el retiro.",
                        "INFONAVIT (Vivienda)": "El ahorro para tu vivienda, pagado por tu patrón.",
                        "Préstamos": "Si tienes algún préstamo personal con la empresa (FONACOT, etc.)."
                    }
                },
                {
                    seccion: "Incapacidades",
                    descripcion: "Si faltaste al trabajo por enfermedad o accidente, aquí se registran los días y el pago que te corresponde (generalmente el 60% o 100% de tu sueldo)."
                }
            ],
            fileUrl: "https://firebasestorage.googleapis.com/.../guia_interactiva_recibo.pdf"
        }
    },
    {
        id: "doc-apoyo-checklist-renuncia-01",
        title: "Checklist para tu Renuncia Voluntaria",
        category: "SUPPORT",
        description: "Una lista de pasos y documentos que debes tener en cuenta para que tu renuncia sea un proceso tranquilo y sin problemas.",
        isPremium: false,
        visualAsset: 'RESIGNATION_CHECKLIST',
        content: {
            introduccion: "Renunciar es un derecho, pero hacerlo de forma correcta te protegerá de futuros problemas. Sigue esta lista.",
            checklist: [
                {
                    paso: "Revisa tu Contrato",
                    descripcion: "Busca el 'preaviso'. Muchos contratos exigen que avises con 15 días de anticipación. Si no lo haces, el patrón podría descontarte esos días de tu finiquito."
                },
                {
                    paso: "Escribe tu Carta de Renuncia",
                    descripcion: "Usa nuestra plantilla en 'Mi Baúl'. Sé formal, pero breve. No es necesario dar explicaciones extensas."
                },
                {
                    paso: "Reúne tus Documentos",
                    descripcion: "Antes de tu último día, solicita y guarda: tus últimos recibos de pago, constancias de IMSS/INFONAVIT y cualquier comprobante de prestaciones."
                },
                {
                    paso: "Entrega tu Carta",
                    description: "Entrega la carta en persona a Recursos Humanos y pide una copia firmada con sello de recibido como acuse. Si no te la dan, envíala por correo certificado con acuse de recibo."
                },
                {
                    paso: "Solicita tu Finiquito",
                    descripcion: "Al finalizar tu relación laboral, solicita por escrito tu finiquito. La empresa tiene 7 días para pagártelo a partir de que se lo exijas."
                },
                {
                    paso: "Revisa tu Finiquito",
                    descripcion: "Usa nuestras calculadoras para verificar que el cálculo de tu finiquito (aguinaldo, vacaciones, prima, etc.) sea correcto antes de firmar."
                }
            ]
        }
    },
    {
        id: "doc-apoyo-finiquito-01",
        title: "Guía para Entender tu Finiquito",
        category: "SUPPORT",
        description: "Aprende a identificar cada componente de tu finiquito para asegurarte de que te pagan todo lo que te corresponde.",
        isPremium: false,
        visualAsset: 'SETTLEMENT_GUIDE',
        content: {
            queEs: "El finiquito es el pago de todas las deudas que el patrón tiene contigo al terminar la relación laboral. Debe ser detallado y transparente.",
            componentes: [
                {
                    concepto: "Salarios Pendientes",
                    descripcion: "El pago de los días trabajados desde tu última quincena hasta tu último día."
                },
                {
                    concepto: "Vacaciones",
                    descripcion: "El pago de los días de vacaciones que no disfrutaste, más el 25% de la prima vacacional."
                },
                {
                    concepto: "Aguinaldo Proporcional",
                    descripcion: "La parte del aguinaldo que te corresponde por los días trabajados en el año actual (15 días de salario por año)."
                },
                {
                    concepto: "Prima Dominical",
                    descripcion: "El pago extra del 25% por cada domingo que trabajaste."
                },
                {
                    concepto: "PTU Proporcional",
                    descripcion: "La parte de las utilidades de la empresa que te corresponde por los días trabajados en el año."
                },
                {
                    concepto: "Indemnización (si aplica)",
                    descripcion: "Si fuiste despedido sin justa causa, corresponde una indemnización de 3 meses de salario + 20 días por cada año trabajado."
                }
            ],
            alerta: "NUNCA firmes un 'finiquito' o una 'carta renuncia' in blanco. Lee cuidadosamente las cantidades y, si no estás de acuerdo, no firmes y busca asesoría legal.",
            fileUrl: "https://firebasestorage.googleapis.com/.../ejemplo_finiquito_desglosado.pdf"
        }
    },
    // SECTION: PRINTABLE GUIDES
    {
        id: "guia-impresible-derechos-01",
        title: "Mis Derechos Fundamentales (Infografía)",
        category: "GUIDE",
        description: "Un resumen visual rápido de los derechos que ningún patrón puede violar. Imprímelo y tenlo a la mano.",
        isPremium: false,
        visualAsset: 'FUNDAMENTAL_RIGHTS',
        content: {
            titulo: "Tus Derechos Son Irrenunciables",
            secciones: [
                {
                    icono: "calendar-clock",
                    titulo: "Jornada y Descanso",
                    puntos: [
                        "Máximo 8 horas diarias o 48 semanales.",
                        "Día de descanso semanal (preferentemente domingo).",
                        "Días festivos pagados (7 al año)."
                    ]
                },
                {
                    icono: "beach",
                    titulo: "Vacaciones",
                    puntos: [
                        "Mínimo 12 días desde el primer año.",
                        "Aumentan con la antigüedad.",
                        "Tienes derecho a una Prima Vacacional del 25%."
                    ]
                },
                {
                    icono: "gift",
                    titulo: "Aguinaldo y PTU",
                    puntos: [
                        "Aguinaldo: Mínimo 15 días de salario.",
                        "PTU: Participación en las utilidades de la empresa.",
                        "Ambos se pagan de forma proporcional."
                    ]
                },
                {
                    icono: "shield-check",
                    titulo: "Seguridad Social",
                    puntos: [
                        "Tu patrón DEBE darte de alta en el IMSS.",
                        "Debe pagar tu INFONAVIT y AFORE.",
                        "No te pueden quitar estas prestaciones."
                    ]
                }
            ],
            pieDePagina: "Para más información, consulta la sección 'Prestaciones de Ley' en Alianza Laboral."
        },
        fileUrl: "https://firebasestorage.googleapis.com/.../infografia_derechos.pdf"
    },
    {
        id: "guia-impresible-emergencia-01",
        title: "Guía de Emergencia: ¿Qué hacer si me despiden?",
        category: "GUIDE",
        description: "Pasos a seguir inmediatamente después de un despido para proteger tu finiquito y tus derechos.",
        isPremium: false,
        visualAsset: 'EMERGENCY_GUIDE',
        content: {
            titulo: "Mantén la Calma y Actúa Rápido",
            pasos: [
                {
                    numero: 1,
                    titulo: "No Firmes Nada Bajo Presión",
                    descripcion: "No firmes una renuncia, un finiquito ni un 'finiquito en blanco' si no estás de acuerdo o no entiendes lo que firmas. Tienes derecho a llevártelo para analizarlo."
                },
                {
                    numero: 2,
                    titulo: "Pide por Escrito tu Finiquito",
                    descripcion: "Exige por escrito (correo o carta con acuse de recibo) el desglose de tu finiquito y liquidación. La empresa tiene 7 días para dártelo después de que se lo exijas."
                },
                {
                    numero: 3,
                    titulo: "Reúne tus Evidencias",
                    descripcion: "Guarda tus últimos recibos de pago, tu contrato, cualquier correo o mensaje de WhatsApp relacionado con tu trabajo y, si es posible, graba la conversación de tu despido (en México, es válido si eres parte de la conversación)."
                },
                {
                    numero: 4,
                    titulo: "Calcula lo que te Deben",
                    descripcion: "Usa las calculadoras de Alianza Laboral para tener una cifra clara de tu finiquito, aguinaldo proporcional, vacaciones, etc."
                },
                {
                    numero: 5,
                    titulo: "Busca Asesoría Legal",
                    descripcion: "Si no hay acuerdo o crees que tus derechos fueron violados, contacta a un abogado certificado a través de Alianza Laboral."
                }
            ]
        },
        fileUrl: "https://firebasestorage.googleapis.com/.../guia_emergencia_despido.pdf"
    }
];
