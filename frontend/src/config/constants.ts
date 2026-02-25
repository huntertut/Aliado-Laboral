// ============================================
// CONFIGURACIÓN DE IP - CASA/OFICINA
// ============================================

// DIGITAL OCEAN DROPLET URL (LIVE)
// export const API_URL = 'http://142.93.186.75:3001';

// LOCAL URL FOR ANDROID EMULATOR DEBUGGING
// 10.0.2.2 siempre apunta al 'localhost' de la computadora desde el emulador Android
export const API_URL = `http://10.0.2.2:3001`;

// Para verificar qué IP estás usando, descomenta la siguiente línea:
// console.log('🌐 Conectando a:', API_URL);

export const LABOR_LAW_CONSTANTS = {
    // Values for 2024
    MINIMUM_WAGE: 248.93, // Salario Mínimo General
    MINIMUM_WAGE_BORDER: 374.89, // Zona Libre de la Frontera Norte (Future use)
    UMA: 108.57, // Unidad de Medida y Actualización (Daily)

    // Defaults
    DEFAULT_VACATION_DAYS: 12, // 1st Year
    DEFAULT_VACATION_PREMIUM: 25, // %
    DEFAULT_AGUINALDO_DAYS: 15,

    // Tax Factors (Simplified for estimation)
    ISR_ESTIMATE_RATE: 0.15, // Flat 15% for rough estimation if table not used
};

export const SEPARATION_REASONS = [
    { id: 'renuncia', label: 'Renuncia Voluntaria', indemnification: false },
    { id: 'termino', label: 'Término de Contrato', indemnification: false },
    { id: 'jubilacion', label: 'Jubilación / Pensión', indemnification: false },
    { id: 'despido_justificado', label: 'Despido Justificado', indemnification: false },
    { id: 'despido_injustificado', label: 'Despido Injustificado', indemnification: true },
];
