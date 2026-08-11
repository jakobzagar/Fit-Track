export function workoutDateInputValue(timestamp: string) {
    return timestamp.slice(0, 10);
}

export function formatWorkoutDate(
    timestamp: string,
    options?: Intl.DateTimeFormatOptions,
    locale?: Intl.LocalesArgument,
) {
    return new Intl.DateTimeFormat(locale, {...options, timeZone: "UTC"}).format(
        new Date(timestamp),
    );
}
