const moment = require('moment');

// Mock of the updated PymeService logic
const calculateLiquidation = (params) => {
    const { 
        separationReason, 
        vacationsTaken = 0,
        aguinaldoDays = 15,
        vacationPremiumRate = 0.25 
    } = params;
    
    let dailySalary = params.dailySalary || 0;
    if (params.monthlySalary && !dailySalary) {
        dailySalary = params.monthlySalary / 30;
    }

    const start = moment(params.startDate);
    const end = moment(params.endDate);
    const totalDays = end.diff(start, 'days') + 1;
    const years = Math.floor(totalDays / 365.25);
    const seniorityYears = totalDays / 365.25;

    const currentVacationDaysEntitlement = params.vacationDays || 12;

    const aguinaldoFactor = aguinaldoDays / 365;
    const vacationFactor = (currentVacationDaysEntitlement * vacationPremiumRate) / 365;
    const sdi = dailySalary * (1 + aguinaldoFactor + vacationFactor);

    const currentYearStart = moment(end).startOf('year');
    const daysInCurrentYear = end.diff(currentYearStart, 'days') + 1;
    const aguinaldo = (dailySalary * aguinaldoDays * daysInCurrentYear) / 365;

    let lastAnniversary = moment(start).add(years, 'years');
    if (lastAnniversary.isAfter(end)) {
        lastAnniversary = moment(start).add(years - 1, 'years');
    }
    const daysSinceAnniversary = end.diff(lastAnniversary, 'days') + 1;

    const vacationProportional = (currentVacationDaysEntitlement * dailySalary * daysSinceAnniversary) / 365;
    const anniversaryMatches = end.date() === start.date() && end.month() === start.month();
    const adjustedVacation = vacationProportional + (anniversaryMatches ? dailySalary * currentVacationDaysEntitlement : 0) - (vacationsTaken * dailySalary);
    
    const vacationPrime = Math.max(0, adjustedVacation * vacationPremiumRate);

    let seniorityPrime = 0;
    const eligibleForSeniority = 
        (['despido_injustificado', 'despido_justificado', 'jubilacion', 'termino_contrato'].includes(separationReason)) || 
        (separationReason === 'renuncia' && years >= 15);
    
    if (eligibleForSeniority) {
        const MIN_WAGE = 248.93;
        const dailySalaryCapped = Math.min(dailySalary, MIN_WAGE * 2);
        seniorityPrime = dailySalaryCapped * 12 * seniorityYears;
    }

    let indemnity = 0;
    if (separationReason === 'despido_injustificado') {
        indemnity = sdi * 90;
    }

    const workedDay = dailySalary * 1;
    const subtotal = aguinaldo + Math.max(0, adjustedVacation) + vacationPrime + seniorityPrime + indemnity + workedDay;

    return {
        aguinaldo: parseFloat(aguinaldo.toFixed(2)),
        vacations: parseFloat(Math.max(0, adjustedVacation).toFixed(2)),
        vacationPrime: parseFloat(vacationPrime.toFixed(2)),
        seniorityPrime: parseFloat(seniorityPrime.toFixed(2)),
        indemnity: parseFloat(indemnity.toFixed(2)),
        workedDay: parseFloat(workedDay.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2)),
        sdi: parseFloat(sdi.toFixed(2))
    };
};

const runTest = () => {
    console.log("=== Testing User Scenario: Resignation ===");
    const resignation = calculateLiquidation({
        monthlySalary: 15000,
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        separationReason: 'renuncia',
        aguinaldoDays: 25,
        vacationDays: 12,
        vacationPremiumRate: 0.25
    });
    console.log(resignation);
    console.log("Expected Total: 8034.25");
    if (resignation.total === 8034.25) console.log("✅ MATCH!"); else console.log("❌ MISMATCH!");

    console.log("\n=== Testing User Scenario: Unjustified Dismissal ===");
    const layoff = calculateLiquidation({
        monthlySalary: 15000,
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        separationReason: 'despido_injustificado',
        aguinaldoDays: 25,
        vacationDays: 12,
        vacationPremiumRate: 0.25
    });
    console.log(layoff);
    console.log("Expected SDI: 538.35");
    console.log("Expected Total: 74485.75"); 
    // User calculation: 8034.25 (finiquito) + 18000 (seniority) + 48451.50 (indemnity) = 74485.75
    if (layoff.total === 74485.75) console.log("✅ MATCH!"); else console.log("❌ MISMATCH!");
};

runTest();
