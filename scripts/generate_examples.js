const calculateLiquidation = (params) => {
    const { 
        separationReason, 
        vacationsTaken = 0,
        aguinaldoDays = 15,
        vacationPremiumRate = 0.25 
    } = params;
    
    let dailySalary = params.dailySalary || (params.monthlySalary / 30);
    const start = new Date(params.startDate + 'T00:00:00');
    const end = new Date(params.endDate + 'T00:00:00');
    const diffTime = Math.abs(end - start);
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const years = Math.floor((totalDays - 0.5) / 365.25);
    const seniorityYears = totalDays / 365.25;
    const currentVacationDaysEntitlement = params.vacationDays || 12;

    const aguinaldoFactor = aguinaldoDays / 365;
    const vacationFactor = (currentVacationDaysEntitlement * vacationPremiumRate) / 365;
    const sdi = dailySalary * (1 + aguinaldoFactor + vacationFactor);

    // Aguinaldo (Jan 1 to End Date)
    const startOfYear = new Date(end.getFullYear(), 0, 1);
    const daysInCurrentYear = Math.round(Math.abs(end - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    const aguinaldo = (dailySalary * aguinaldoDays * daysInCurrentYear) / 365;

    // Vacation proportional
    const anniversaryMatches = end.getDate() === start.getDate() && end.getMonth() === start.getMonth();
    const lastAnniversary = new Date(start.getFullYear() + years, start.getMonth(), start.getDate());
    const daysSinceAnniversary = Math.round(Math.abs(end - lastAnniversary) / (1000 * 60 * 60 * 24)) + 1;
    
    const vacationsCurrentPeriod = (currentVacationDaysEntitlement / 365) * daysSinceAnniversary;
    const vacationsCompletedYear = (anniversaryMatches && years >= 1) ? currentVacationDaysEntitlement : 0;
    const totalVacationDaysEarned = vacationsCurrentPeriod + vacationsCompletedYear;
    const vacationPay = dailySalary * totalVacationDaysEarned;
    const vacationPrime = Math.max(0, vacationPay * vacationPremiumRate);

    let seniorityPrime = 0;
    const eligibleForSeniority = (['despido_injustificado', 'despido_justificado', 'jubilacion', 'termino_contrato'].includes(separationReason)) || (separationReason === 'renuncia' && years >= 15);
    if (eligibleForSeniority) {
        const MIN_WAGE = 248.93;
        const dailySalaryCapped = Math.min(dailySalary, MIN_WAGE * 2);
        seniorityPrime = dailySalaryCapped * 12 * seniorityYears;
    }

    let indemnity = 0;
    if (separationReason === 'despido_injustificado') indemnity = sdi * 90;

    const workedDay = dailySalary * 1;
    const total = aguinaldo + vacationPay + vacationPrime + seniorityPrime + indemnity + workedDay;

    return {
        years,
        dailySalary: dailySalary.toFixed(2),
        sdi: sdi.toFixed(2),
        aguinaldo: aguinaldo.toFixed(2),
        vacations: vacationPay.toFixed(2),
        vacationPrime: vacationPrime.toFixed(2),
        seniorityPrime: seniorityPrime.toFixed(2),
        indemnity: indemnity.toFixed(2),
        total: total.toFixed(2)
    };
};

console.log("EJEMPLO 1: Renuncia a los 6 meses");
console.log(calculateLiquidation({
    monthlySalary: 10000,
    startDate: '2025-06-01',
    endDate: '2025-12-31',
    separationReason: 'renuncia',
    aguinaldoDays: 15,
    vacationDays: 12
}));

console.log("\nEJEMPLO 2: Despido Injustificado (14 años)");
console.log(calculateLiquidation({
    monthlySalary: 20000,
    startDate: '2010-01-01',
    endDate: '2024-01-01',
    separationReason: 'despido_injustificado',
    aguinaldoDays: 30,
    vacationDays: 24,
    vacationPremiumRate: 0.50
}));
