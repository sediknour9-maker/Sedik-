/**
 * Estimates calories burned for a cardio activity using the MET formula:
 * kcal = MET * body weight (kg) * duration (hours).
 */
export function computeCardioKcal(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}
