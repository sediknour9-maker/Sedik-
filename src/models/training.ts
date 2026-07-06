export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'fullBody';
export type Equipment = 'bodyweight' | 'dumbbell' | 'barbell' | 'machine';

export interface Exercise {
  id: string;
  nameKey: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  sets: number;
  reps: string; // e.g. "8-12"
}

export interface WorkoutDay {
  id: string;
  nameKey: string;
  exerciseIds: string[];
}

export type EquipmentPreference = 'gym' | 'home';

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
}

export interface GeneratedDay {
  id: string;
  dayNumber: number;
  focusKey: string; // 'training.focusFull' | 'training.focusUpper' | 'training.focusLower'
  items: PlannedExercise[];
}

export interface GeneratedPlan {
  days: GeneratedDay[];
  equipment: EquipmentPreference;
  generatedAt: string;
}

export interface MobilityExercise {
  id: string;
  nameKey: string;
  targetKey: string; // i18n key for target area
  durationSec: number;
}

export interface CardioActivity {
  id: string;
  nameKey: string;
  met: number; // metabolic equivalent, kcal = MET * kg * hours
}

export type ActivityType = 'strength' | 'cardio' | 'mobility';

export interface ActivityLogEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: ActivityType;
  refId: string; // WorkoutDay id, CardioActivity id, or 'routine'
  durationMin?: number;
  kcalBurned?: number;
  loggedAt: string;
}

export interface WeightEntry {
  date: string; // 'YYYY-MM-DD'
  weightKg: number;
}
