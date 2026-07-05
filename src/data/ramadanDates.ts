/**
 * Approximate Gregorian date ranges for Ramadan, derived from published
 * astronomical calendar estimates. Actual start/end can shift by ~1 day
 * depending on local moon-sighting announcements (e.g. Morocco's Habous
 * ministry), so these are used for auto-detection only; users can always
 * override via Settings.
 */
export interface RamadanRange {
  hijriYear: number;
  start: string; // 'YYYY-MM-DD'
  end: string; // 'YYYY-MM-DD'
}

export const RAMADAN_RANGES: RamadanRange[] = [
  { hijriYear: 1445, start: '2024-03-11', end: '2024-04-09' },
  { hijriYear: 1446, start: '2025-03-01', end: '2025-03-30' },
  { hijriYear: 1447, start: '2026-02-18', end: '2026-03-19' },
  { hijriYear: 1448, start: '2027-02-08', end: '2027-03-09' },
  { hijriYear: 1449, start: '2028-01-28', end: '2028-02-26' },
  { hijriYear: 1450, start: '2029-01-17', end: '2029-02-15' },
  { hijriYear: 1451, start: '2030-01-06', end: '2030-02-04' },
];
