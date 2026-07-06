import {
  isRamadanActive,
  getMealSlotsFor,
  RAMADAN_MEAL_SLOTS,
  STANDARD_MEAL_SLOTS,
} from '../src/services/ramadanService';

describe('ramadanService', () => {
  const insideRamadan2026 = '2026-03-01'; // within 2026-02-18..2026-03-19
  const outsideRamadan2026 = '2026-01-01';

  it('auto-detects a date inside a known Ramadan range', () => {
    expect(isRamadanActive(insideRamadan2026, 'auto')).toBe(true);
  });

  it('auto-detects a date outside any known Ramadan range', () => {
    expect(isRamadanActive(outsideRamadan2026, 'auto')).toBe(false);
  });

  it('lets a manual "on" override win even outside the date range', () => {
    expect(isRamadanActive(outsideRamadan2026, 'on')).toBe(true);
  });

  it('lets a manual "off" override win even inside the date range', () => {
    expect(isRamadanActive(insideRamadan2026, 'off')).toBe(false);
  });

  it('returns Ramadan meal slots when active', () => {
    expect(getMealSlotsFor(insideRamadan2026, 'auto')).toEqual(RAMADAN_MEAL_SLOTS);
  });

  it('returns standard meal slots when not active', () => {
    expect(getMealSlotsFor(outsideRamadan2026, 'auto')).toEqual(STANDARD_MEAL_SLOTS);
  });
});
