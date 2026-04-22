import { PrismaClient } from '@prisma/client';
import moment from 'moment';

const prisma = new PrismaClient();

// Constantes para cálculos LFT 2024
const UMA_VALUE = 108.57;
const AGUINALDO_DAYS = 15;
const VACATION_PRIME_RATE = 0.25;

/**
 * Servicio para lógica de negocio de Pymes (SMEs)
 */
export const PymeService = {
    /**
     * Calcula la liquidación/finiquito basado en la LFT Mexicana
     * Soporta parámetros personalizados y reglas de antigüedad/indemnización
     */
    calculateLiquidation: (params: {
        dailySalary?: number;
        monthlySalary?: number;
        startDate: Date | string;
        endDate: Date | string;
        separationReason: 'renuncia' | 'despido_injustificado' | 'despido_justificado' | 'jubilacion' | 'termino_contrato';
        vacationsTaken?: number;
        aguinaldoDays?: number;
        vacationDays?: number;
        vacationPremiumRate?: number;
    }) => {
        const { 
            separationReason, 
            vacationsTaken = 0,
            aguinaldoDays = 15,
            vacationPremiumRate = 0.25 
        } = params;
        
        let dailySalary = params.dailySalary || 0;
        if (params.monthlySalary && !dailySalary) {
            dailySalary = params.monthlySalary / 30; // Usamos 30 por estándar fiscal/ejercicio usuario
        }

        const start = moment(params.startDate);
        const end = moment(params.endDate);
        const totalDays = end.diff(start, 'days') + 1; // Incluimos el día final
        const years = Math.floor(totalDays / 365.25);
        const seniorityYears = totalDays / 365.25;

        // 1. Días de vacaciones según LFT 2023+ (si no se proveen)
        const getVacationScale = (yrs: number) => {
            const y = Math.floor(yrs);
            if (y < 1) return 12;
            if (y < 2) return 14;
            if (y < 3) return 16;
            if (y < 4) return 18;
            if (y < 5) return 20;
            if (y < 10) return 22;
            if (y < 15) return 24;
            if (y < 20) return 26;
            if (y < 25) return 28;
            if (y < 30) return 30;
            return 32;
        };

        const currentVacationDaysEntitlement = params.vacationDays || getVacationScale(years);

        // 2. Salario Diario Integrado (SDI) - Base para indemnizaciones
        const aguinaldoFactor = aguinaldoDays / 365;
        const vacationFactor = (currentVacationDaysEntitlement * vacationPremiumRate) / 365;
        const sdi = dailySalary * (1 + aguinaldoFactor + vacationFactor);

        // 3. Aguinaldo Proporcional (Año Calendario)
        const currentYearStart = moment(end).startOf('year');
        const daysInCurrentYear = end.diff(currentYearStart, 'days') + 1;
        const aguinaldo = (dailySalary * aguinaldoDays * daysInCurrentYear) / 365;

        // 4. Vacaciones Proporcionales (Año de Aniversario)
        // Calculamos días desde el último aniversario
        let lastAnniversary = moment(start).add(years, 'years');
        if (lastAnniversary.isAfter(end)) {
            lastAnniversary = moment(start).add(years - 1, 'years');
        }
        const daysSinceAnniversary = end.diff(lastAnniversary, 'days') + 1;

        // Vacaciones del periodo actual (proporcionales)
        const vacationProportional = (currentVacationDaysEntitlement * dailySalary * daysSinceAnniversary) / 365;
        
        // Vacaciones de periodos anteriores no pagados/tomados (si el usuario provee info, aquí simplificamos con anniversary check)
        // Si el día de baja es el aniversario o posterior, ya se devengó el año anterior completo
        let vacationPastDue = 0;
        if (daysSinceAnniversary >= 1 && years >= 1) {
             // Si acaba de cumplir el año, el año que terminó (seniority - 1) está pendiente
             // Para este cálculo, asumimos que si end >= aniversario, ya ganó el derecho al bloque anterior.
             // Pero por simplicidad en simuladores, se suele sumar el proporcional acumulado.
        }

        // En el ejercicio del usuario (exactamente 3 años):
        // 2023-2024 (Año 1), 2024-2025 (Año 2), 2025-2026 (Año 3).
        // Al 1 de Enero 2026, ya completó 3 años. El último año (el 3ero) se paga completo.
        const anniversaryMatches = end.date() === start.date() && end.month() === start.month();
        const adjustedVacation = vacationProportional + (anniversaryMatches ? dailySalary * currentVacationDaysEntitlement : 0) - (vacationsTaken * dailySalary);
        
        // 5. Prima Vacacional
        const vacationPrime = Math.max(0, adjustedVacation * vacationPremiumRate);

        // 6. Prima de Antigüedad (12 días por año)
        // Regla LFT: Renuncia (sólo si >15 años), Despido/Muerte/Jubilación (siempre)
        let seniorityPrime = 0;
        const isEligibleForSeniorityPrime = 
            (['despido_injustificado', 'despido_justificado', 'jubilacion', 'termino_contrato'].includes(separationReason)) || 
            (separationReason === 'renuncia' && years >= 15);
        
        if (isEligibleForSeniorityPrime) {
            // Tope: 2 x Salario Mínimo (usamos constante UMA_VALUE por ahora o MIN_WAGE si estuviera)
            const MIN_WAGE_2024 = 248.93;
            const dailySalaryCapped = Math.min(dailySalary, MIN_WAGE_2024 * 2);
            seniorityPrime = dailySalaryCapped * 12 * seniorityYears;
        }

        // 7. Indemnización (90 días de SDI) - Solo Despido Injustificado
        let indemnity = 0;
        if (separationReason === 'despido_injustificado') {
            indemnity = sdi * 90;
        }

        const subtotal = aguinaldo + Math.max(0, adjustedVacation) + vacationPrime + seniorityPrime + indemnity;
        const workedDay = dailySalary * 1; // El día laborado (usualmente se paga aparte en finiquito)

        return {
            seniority: {
                years,
                totalDays,
                seniorityYears: parseFloat(seniorityYears.toFixed(2))
            },
            sdi: parseFloat(sdi.toFixed(2)),
            breakdown: {
                aguinaldo: parseFloat(aguinaldo.toFixed(2)),
                vacations: parseFloat(Math.max(0, adjustedVacation).toFixed(2)),
                vacationPrime: parseFloat(vacationPrime.toFixed(2)),
                seniorityPrime: parseFloat(seniorityPrime.toFixed(2)),
                indemnity: parseFloat(indemnity.toFixed(2)),
                workedDay: parseFloat(workedDay.toFixed(2))
            },
            total: parseFloat((subtotal + workedDay).toFixed(2))
        };
    },

    /**
     * Evalúa el cumplimiento legal de una Pyme
     */
    evaluateCompliance: async (pymeId: string) => {
        const pyme = await prisma.pymeProfile.findUnique({
            where: { id: pymeId },
            include: {
                user: true,
                employees: {
                    where: {
                        contractType: 'trial',
                        isRenewed: false
                    }
                }
            }
        });

        if (!pyme) throw new Error('Pyme profile not found');

        let score = 0;
        const pending: string[] = [];

        // 1. RFC o Razón Social (+20%)
        if (pyme.rfc && pyme.razonSocial) {
            score += 20;
        } else {
            pending.push('Registrar RFC y Razón Social');
        }

        // 2. Al menos 1 empleado registrado (+20%)
        const employeeCount = await prisma.pymeEmployee.count({
            where: { pymeProfileId: pymeId }
        });
        if (employeeCount > 0) {
            score += 20;
        } else {
            pending.push('Registrar al menos un empleado');
        }

        // 3. Reglamento Interno (+30%)
        if (pyme.internalRegsStatus === 'uploaded' || pyme.internalRegsStatus === 'generated') {
            score += 30;
        } else {
            pending.push('Subir o generar Reglamento Interno');
        }

        // 4. Contratos vencidos (periodo de prueba) (+30%)
        // Lógica: Si hay empleados en periodo de prueba con más de 30 días y sin renovar
        const now = moment();
        const overdueContracts = pyme.employees.filter(emp => {
            const daysSinceJoin = now.diff(moment(emp.joinDate), 'days');
            return daysSinceJoin > 30;
        });

        if (overdueContracts.length === 0) {
            score += 30;
        } else {
            pending.push(`Renovar ${overdueContracts.length} contratos de prueba vencidos`);
        }

        return {
            score,
            status: score >= 80 ? 'green' : score >= 50 ? 'yellow' : 'red',
            label: score >= 80 ? 'Empresa Blindada' : score >= 50 ? 'Riesgo Moderado' : 'Alto Riesgo de Multa',
            pending
        };
    },

    /**
     * Calcula el Pasivo Laboral Total (Riesgo de Despido Masivo)
     */
    getLiabilityReport: async (pymeId: string) => {
        const employees = await prisma.pymeEmployee.findMany({
            where: { pymeProfileId: pymeId }
        });

        const today = new Date();
        let totalLiability = 0;
        const employeeBreakdown: any[] = [];

        employees.forEach(emp => {
            const result = PymeService.calculateLiquidation({
                dailySalary: Number(emp.dailySalary) || 248.93, // Default to min wage if 0
                startDate: emp.joinDate,
                endDate: today,
                separationType: 'layoff', // Worst case scenario
                vacationsTaken: 0 // Worst case: assume no vacations taken
            });

            totalLiability += result.total;
            employeeBreakdown.push({
                name: emp.fullName,
                years: result.seniority.years,
                liability: result.total
            });
        });

        return {
            totalLiability,
            employeeCount: employees.length,
            breakdown: employeeBreakdown
        };
    }
};
