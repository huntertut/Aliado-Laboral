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
     */
    calculateLiquidation: (params: {
        dailySalary: number;
        startDate: Date;
        endDate: Date;
        separationType: 'resignation' | 'layoff';
        vacationsTaken: number;
    }) => {
        const { dailySalary, startDate, endDate, separationType, vacationsTaken } = params;

        const start = moment(startDate);
        const end = moment(endDate);
        const totalDays = end.diff(start, 'days');
        const years = Math.floor(totalDays / 365);
        const seniorityYears = totalDays / 365;

        // 1. Aguinaldo Proporcional (15 días por año)
        const currentYearStart = moment(end).startOf('year');
        const daysInCurrentYear = end.diff(currentYearStart, 'days') + 1;
        const aguinaldo = (dailySalary * AGUINALDO_DAYS * daysInCurrentYear) / 365;

        // 2. Vacaciones Proporcionales
        // LFT 2023+: 12 días el primer año, +2 cada año hasta 20, luego +2 cada 5 años.
        const getVacationDays = (yrs: number) => {
            if (yrs < 1) return 12; // Se asume el primer año completo para el cálculo proporcional
            if (yrs >= 1 && yrs < 2) return 14;
            if (yrs >= 2 && yrs < 3) return 16;
            if (yrs >= 3 && yrs < 4) return 18;
            if (yrs >= 4 && yrs < 5) return 20;
            // Para fines de este MVP, simplificamos la escala
            return 20 + Math.floor((yrs - 5) / 5) * 2;
        };

        const daysCorresponding = getVacationDays(years);
        const anniversary = moment(startDate).add(years, 'years');
        const daysSinceAnniversary = end.diff(anniversary, 'days');
        const vacationProportional = (daysCorresponding * dailySalary * daysSinceAnniversary) / 365;

        // Ajuste por días tomados (esto es complejo, aquí descontamos del monto proporcional si aplica)
        // Nota: En la práctica se descuentan los días, aquí restamos el valor monetario de los días tomados
        // pero esto depende de SI correspondían a este periodo. Asumimos días tomados del periodo actual.
        const adjustedVacation = Math.max(0, vacationProportional - (vacationsTaken * dailySalary));

        // 3. Prima Vacacional (25%)
        const vacationPrime = adjustedVacation * VACATION_PRIME_RATE;

        // 4. Prima de Antigüedad (12 días por año)
        // Tope: 2 veces el salario mínimo o UMA (según interpretación común, usamos UMA para 2024)
        const dailySalaryCapped = Math.min(dailySalary, UMA_VALUE * 2);
        const seniorityPrime = dailySalaryCapped * 12 * seniorityYears;

        // 5. Indemnización (3 meses) - Solo por despido
        let indemnity = 0;
        if (separationType === 'layoff') {
            indemnity = dailySalary * 90; // 3 meses = 90 días
        }

        const subtotal = aguinaldo + adjustedVacation + vacationPrime + seniorityPrime + indemnity;

        return {
            seniority: {
                years,
                totalDays,
                seniorityYears: parseFloat(seniorityYears.toFixed(2))
            },
            breakdown: {
                aguinaldo: parseFloat(aguinaldo.toFixed(2)),
                vacations: parseFloat(adjustedVacation.toFixed(2)),
                vacationPrime: parseFloat(vacationPrime.toFixed(2)),
                seniorityPrime: parseFloat(seniorityPrime.toFixed(2)),
                indemnity: parseFloat(indemnity.toFixed(2)),
            },
            total: parseFloat(subtotal.toFixed(2))
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
