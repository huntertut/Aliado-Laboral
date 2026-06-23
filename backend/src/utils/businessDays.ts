/**
 * Adds business days to a date, skipping Saturdays and Sundays.
 */
export const addBusinessDays = (startDate: Date, days: number): Date => {
    const result = new Date(startDate.getTime());
    let addedDays = 0;
    while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay(); // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    return result;
};

/**
 * Calculates the number of business days (skipping Saturday and Sunday) between two dates.
 * Returns a positive number if endDate is after startDate.
 */
export const getBusinessDaysDiff = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate.getTime());
    const end = new Date(endDate.getTime());
    
    // Normalize both to midnight to avoid hour discrepancies
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let count = 0;
    const curDate = new Date(start.getTime());

    if (curDate < end) {
        while (curDate < end) {
            curDate.setDate(curDate.getDate() + 1);
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
        }
    } else {
        while (curDate > end) {
            curDate.setDate(curDate.getDate() - 1);
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count--;
            }
        }
    }
    return count;
};

/**
 * Calculates the number of working days for a worker (skipping ONLY Sundays) between two dates.
 * Returns a positive number if endDate is after startDate.
 */
export const getWorkerDaysDiff = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate.getTime());
    const end = new Date(endDate.getTime());
    
    // Normalize both to midnight to avoid hour discrepancies
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let count = 0;
    const curDate = new Date(start.getTime());

    if (curDate < end) {
        while (curDate < end) {
            curDate.setDate(curDate.getDate() + 1);
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0) { // Exclude Sunday (0) only
                count++;
            }
        }
    } else {
        while (curDate > end) {
            curDate.setDate(curDate.getDate() - 1);
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0) { // Exclude Sunday (0) only
                count--;
            }
        }
    }
    return count;
};
