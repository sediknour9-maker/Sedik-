import type { ActivityLevel, DailyTargets, Goal, Sex } from '../models/user';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

const GOAL_ADJUSTMENT_KCAL: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 350,
};

const MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 };

export interface CalorieInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

/** Mifflin-St Jeor basal metabolic rate. */
export function computeBMR({ sex, age, heightCm, weightKg }: CalorieInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/** Total daily energy expenditure = BMR * activity multiplier. */
export function computeTDEE(input: CalorieInput): number {
  return computeBMR(input) * ACTIVITY_MULTIPLIERS[input.activityLevel];
}

export function computeTargets(input: CalorieInput): DailyTargets {
  const kcal = Math.round(computeTDEE(input) + GOAL_ADJUSTMENT_KCAL[input.goal]);
  return {
    kcal,
    proteinG: Math.round((kcal * MACRO_SPLIT.protein) / 4),
    carbsG: Math.round((kcal * MACRO_SPLIT.carbs) / 4),
    fatG: Math.round((kcal * MACRO_SPLIT.fat) / 9),
  };
}
