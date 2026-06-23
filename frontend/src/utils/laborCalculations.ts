import { differenceInDays, parse, isValid } from 'date-fns';
import { LABOR_LAW_CONSTANTS } from '../config/constants';

export interface LaborCalculationInput {
    startDate: string;
    endDate: string;
    monthlySalary: string;
    vacationDays: string;
    vacationPremium: string;
    aguinaldoDays: string;
    hasPendingSalary: boolean;
    pendingDays: string;
    separationReason: string;
}

export interface LaborCalculationResult {
    yearsWorked: number;
    dailySalary: number;
    sdi: number;
    pendingSalary: number;
    aguinaldo: number;
    vacationPay: number;
    primaVacacional: number;
    finiquitoTotal: number;
    indemnizacion: number;
    seniorityPremium: number;
    liquidacionTotal: number;
    estimatedISR: number;
    totalNet: number;
    hasIndemnification: boolean;
}

/**
 * Calculates proportional benefits (finiquito) and severance (liquidación)
 * according to the Mexican Federal Labor Law (LFT).
 */
export const calculateLaborBenefits = (input: LaborCalculationInput): LaborCalculationResult | null => {
    const {
        startDate,
        endDate,
        monthlySalary,
        vacationDays,
        vacationPremium,
        aguinaldoDays,
        hasPendingSalary,
        pendingDays,
        separationReason
    } = input;

    if (!startDate || !endDate || !monthlySalary) {
        return null;
    }

    const start = parse(startDate, 'dd/MM/yyyy', new Date());
    const end = parse(endDate, 'dd/MM/yyyy', new Date());

    if (!isValid(start) || !isValid(end)) {
        return null;
    }

    // Calculate tenure
    // Standard LFT: Include the start and end days
    const totalDaysWorked = differenceInDays(end, start) + 1;
    const yearsWorked = Math.floor(totalDaysWorked / 365.25);
    const seniorityYearsDecimal = totalDaysWorked / 365.25;
    
    const daysInCurrentYear = differenceInDays(end, new Date(end.getFullYear(), 0, 1)) + 1;

    // Anniversary check
    let lastAnniversary = new Date(start.getFullYear() + yearsWorked, start.getMonth(), start.getDate());
    if (lastAnniversary > end) {
        lastAnniversary = new Date(start.getFullYear() + yearsWorked - 1, start.getMonth(), start.getDate());
    }
    const daysSinceAnniversary = differenceInDays(end, lastAnniversary) + 1;

    // Salary calculations
    const monthly = parseFloat(monthlySalary);
    const dailySalary = monthly / 30; // Usando 30 para coincidir con ejercicio manual

    // 1. SDI (Salario Diario Integrado)
    const aguinaldoFactor = parseFloat(aguinaldoDays) / 365;
    const vacationFactor = (parseFloat(vacationDays) * (parseFloat(vacationPremium) / 100)) / 365;
    const sdi = dailySalary * (1 + aguinaldoFactor + vacationFactor);

    // 2. Pending Salary
    const pendingSalaryAmount = hasPendingSalary ? dailySalary * parseFloat(pendingDays || '0') : 0;

    // 3. Aguinaldo (Proportional to CALENDAR YEAR)
    const aguinaldoProportional = (dailySalary * parseFloat(aguinaldoDays) / 365) * daysInCurrentYear;

    // 4. Vacations & Premium (Proportional to ANNIVERSARY cycle + Completed cycle if anniversary matched)
    const anniversaryMatches = end.getDate() === start.getDate() && end.getMonth() === start.getMonth();
    
    // Vacations earned in current period
    const vacationsCurrentPeriod = (parseFloat(vacationDays) / 365) * daysSinceAnniversary;
    // If anniversary just passed or matches, the FULL entitlement from the year that just ended is due.
    const vacationsCompletedYear = (anniversaryMatches && yearsWorked >= 1) ? parseFloat(vacationDays) : 0;
    
    const totalVacationDaysEarned = vacationsCurrentPeriod + vacationsCompletedYear;
    const vacationPay = dailySalary * totalVacationDaysEarned;
    const primaVacacional = vacationPay * (parseFloat(vacationPremium) / 100);

    // Finiquito Subtotal
    const workedDay = dailySalary * 1; 
    const finiquitoTotal = (hasPendingSalary ? pendingSalaryAmount : workedDay) + aguinaldoProportional + vacationPay + primaVacacional;

    // 5. Indemnification & Seniority
    let indemnizacion = 0;
    let seniorityPremium = 0;

    // Logic for Seniority Premium (12 days per year)
    // LFT: Resignation only if 15+ years. Others: Always.
    const eligibleForSeniority = 
        (['despido_injustificado', 'despido_justificado', 'jubilacion', 'termino'].includes(separationReason || '')) ||
        (separationReason === 'renuncia' && yearsWorked >= 15);

    if (eligibleForSeniority) {
        const salaryCap = 2 * LABOR_LAW_CONSTANTS.MINIMUM_WAGE; // Usualmente SMG para prima antigüedad
        const baseSalaryForSeniority = dailySalary > salaryCap ? salaryCap : dailySalary;
        seniorityPremium = (12 * baseSalaryForSeniority) * seniorityYearsDecimal;
    }

    if (separationReason === 'despido_injustificado') {
        // 90 days of SDI (Indemnización Constitucional)
        indemnizacion = sdi * 90;
    }

    const liquidacionTotal = indemnizacion + seniorityPremium;

    // 6. Deductions (Estimated ISR)
    const subtotal = finiquitoTotal + liquidacionTotal;
    const estimatedISR = subtotal * LABOR_LAW_CONSTANTS.ISR_ESTIMATE_RATE;

    // Final Total
    const totalNet = subtotal - estimatedISR;

    return {
        yearsWorked,
        dailySalary,
        sdi,
        pendingSalary: hasPendingSalary ? pendingSalaryAmount : workedDay,
        aguinaldo: aguinaldoProportional,
        vacationPay,
        primaVacacional,
        finiquitoTotal,
        indemnizacion,
        seniorityPremium,
        liquidacionTotal,
        estimatedISR,
        totalNet,
        hasIndemnification: separationReason === 'despido_injustificado'
    };
};
