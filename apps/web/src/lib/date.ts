/** Formats a Date as a `datetime-local` input value in the browser's local timezone. */
export function toDatetimeLocalValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** Converts a `datetime-local` input value (local time, no timezone) to an ISO string. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
