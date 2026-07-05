export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Sex = 'male' | 'female';
export type RamadanOverride = 'auto' | 'on' | 'off';

export interface DailyTargets {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface UserProfile {
  id: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  createdAt: string;
  targets: DailyTargets;
}
