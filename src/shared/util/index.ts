export * from './classname';
export * from './geolocation';
export * from './validate';

/**
 * Calculate the difference between two dates with precision to hour and minute.
 * Returns { months, days, hours, minutes }
 */
export function diffBetweenDates(start: string | Date, end: string | Date) {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    let months
        = (endDate.getFullYear() - startDate.getFullYear()) * 12
            + (endDate.getMonth() - startDate.getMonth());
    let days = endDate.getDate() - startDate.getDate();
    let hours = endDate.getHours() - startDate.getHours();
    let minutes = endDate.getMinutes() - startDate.getMinutes();

    if (minutes < 0) {
        minutes += 60;
        hours--;
    }
    if (hours < 0) {
        hours += 24;
        days--;
    }
    if (days < 0) {
        // Get days in previous month
        const prevMonth = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            0,
        );
        days += prevMonth.getDate();
        months--;
    }
    return { months, days, hours, minutes };
}

/**
 * Format exact time difference between two dates as a human-readable string.
 * Returns strings like "2 months", "2 months 3 days", "3 years 4 months 1 day"
 */
export function formatExactTimeDifference(
    start: string | Date,
    end: string | Date,
): string {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust for negative days
    if (days < 0) {
        const prevMonth = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            0,
        );
        days += prevMonth.getDate();
        months--;
    }

    // Adjust for negative months
    if (months < 0) {
        months += 12;
        years--;
    }

    // Only show the most significant unit (years > months > days)
    if (years > 0) {
        return `${years} year${years !== 1 ? 's' : ''}`;
    }

    if (months > 0) {
        return `${months} month${months !== 1 ? 's' : ''}`;
    }

    if (days > 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    }

    return '0 days';
}
