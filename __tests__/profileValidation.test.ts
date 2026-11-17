import { isValidBodyValue, parseDecimal } from '../src/services/profileValidation';
import { suggestMealSlot } from '../src/services/ramadanService';

describe('parseDecimal', () => {
  it('accepts comma and dot decimal separators', () => {
    expect(parseDecimal('72,5')).toBe(72.5);
    expect(parseDecimal('72.5')).toBe(72.5);
    expect(parseDecimal(' 180 ')).toBe(180);
  });

  it('accepts a trailing separator while the user is still typing', () => {
    expect(parseDecimal('72,')).toBe(72);
  });

  it('rejects anything that is not a plain positive number', () => {
    expect(parseDecimal('')).toBeNaN();
    expect(parseDecimal('abc')).toBeNaN();
    expect(parseDecimal('-5')).toBeNaN();
    expect(parseDecimal('1e3')).toBeNaN();
    expect(parseDecimal('7 2')).toBeNaN();
  });
});

describe('isValidBodyValue', () => {
  it('accepts values inside the plausible range, including the bounds', () => {
    expect(isValidBodyValue('age', '10')).toBe(true);
    expect(isValidBodyValue('age', '100')).toBe(true);
    expect(isValidBodyValue('heightCm', '175')).toBe(true);
    expect(isValidBodyValue('weightKg', '72,5')).toBe(true);
  });

  it('rejects values outside the range, zero and empty input', () => {
    expect(isValidBodyValue('age', '9')).toBe(false);
    expect(isValidBodyValue('heightCm', '17')).toBe(false);
    expect(isValidBodyValue('weightKg', '0')).toBe(false);
    expect(isValidBodyValue('weightKg', '')).toBe(false);
  });
});

describe('suggestMealSlot', () => {
  it('maps the time of day to the standard meal slots', () => {
    expect(suggestMealSlot(7, false)).toBe('breakfast');
    expect(suggestMealSlot(12, false)).toBe('lunch');
    expect(suggestMealSlot(16, false)).toBe('snack');
    expect(suggestMealSlot(20, false)).toBe('dinner');
    expect(suggestMealSlot(1, false)).toBe('snack');
  });

  it('uses Suhoor before noon and Iftar after during Ramadan', () => {
    expect(suggestMealSlot(4, true)).toBe('suhoor');
    expect(suggestMealSlot(19, true)).toBe('iftar');
  });
});
