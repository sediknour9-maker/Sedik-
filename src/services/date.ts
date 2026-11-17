import { intlLocale } from '../i18n/locale';

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

/** Parses 'YYYY-MM-DD' as local midnight (new Date(string) would parse it as UTC). */
export function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setDate(result.getDate() + days);
  return toDateString(result);
}

/** The n consecutive dates ending at endDate, oldest first. */
export function lastNDates(endDate: string, n: number): string[] {
  return Array.from({ length: n }, (_, index) => addDays(endDate, index - (n - 1)));
}

const DATE_STYLES = {
  full: { weekday: 'long', day: 'numeric', month: 'long' },
  dayMonth: { day: 'numeric', month: 'short' },
  weekdayNarrow: { weekday: 'narrow' },
} satisfies Record<string, Intl.DateTimeFormatOptions>;

export type DateStyle = keyof typeof DATE_STYLES;

export function formatDate(date: string, language: string, style: DateStyle): string {
  try {
    return new Intl.DateTimeFormat(intlLocale(language), DATE_STYLES[style]).format(parseDate(date));
  } catch {
    return date;
  }
}
