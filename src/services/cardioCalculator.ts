/**
 * Estimates calories burned for a cardio activity using the MET formula:
 * kcal = MET * body weight (kg) * duration (hours).
 */
export function computeCardioKcal(met: number, weightKg: number, durationMin: number): number {
  return Math.round(met * weightKg * (durationMin / 60));
}

// Compendium of Physical Activities 02054: resistance training, multiple
// exercises at 8-15 reps. Rest periods are part of the measured duration.
const STRENGTH_TRAINING_MET = 3.5;

export function computeStrengthKcal(weightKg: number, durationMin: number): number {
  return computeCardioKcal(STRENGTH_TRAINING_MET, weightKg, durationMin);
}
