/** Plausible human ranges; anything outside would produce nonsense (or negative) calorie targets. */
export const BODY_LIMITS = {
  age: { min: 10, max: 100 },
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 25, max: 300 },
} as const;

export type BodyField = keyof typeof BODY_LIMITS;

/** Accepts a comma or a dot as decimal separator; returns NaN for anything that isn't a plain number. */
export function parseDecimal(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$/.test(normalized)) return NaN;
  return Number(normalized);
}

export function isValidBodyValue(field: BodyField, value: string): boolean {
  const parsed = parseDecimal(value);
  const { min, max } = BODY_LIMITS[field];
  return parsed >= min && parsed <= max;
}
