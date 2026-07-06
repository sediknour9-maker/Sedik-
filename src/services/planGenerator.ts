import { EXERCISES } from '../data/exercises';
import type { ActivityLevel, Goal } from '../models/user';
import type {
  EquipmentPreference,
  Exercise,
  GeneratedDay,
  GeneratedPlan,
  MuscleGroup,
  PlannedExercise,
} from '../models/training';

export interface PlanInput {
  goal: Goal;
  activityLevel: ActivityLevel;
  equipment: EquipmentPreference;
}

const DAYS_PER_LEVEL: Record<ActivityLevel, number> = {
  sedentary: 2,
  light: 2,
  moderate: 3,
  active: 4,
  veryActive: 4,
};

const REPS_PER_GOAL: Record<Goal, string> = {
  lose: '12-15',
  maintain: '8-12',
  gain: '6-10',
};

const SETS_PER_GOAL: Record<Goal, number> = {
  lose: 3,
  maintain: 3,
  gain: 4,
};

// Muscle-group slot patterns per day focus
const FULL_BODY_SLOTS: MuscleGroup[][] = [['legs'], ['chest'], ['back'], ['shoulders', 'arms'], ['core']];
const UPPER_SLOTS: MuscleGroup[][] = [['chest'], ['back'], ['shoulders'], ['arms'], ['core']];
const LOWER_SLOTS: MuscleGroup[][] = [['legs'], ['legs'], ['legs', 'fullBody'], ['core']];

function poolFor(equipment: EquipmentPreference): Exercise[] {
  if (equipment === 'gym') return EXERCISES;
  return EXERCISES.filter((e) => e.equipment === 'bodyweight' || e.equipment === 'dumbbell');
}

/**
 * Deterministically fills a day's slots from the equipment-filtered pool,
 * rotating through candidates so consecutive days pick different exercises.
 */
function buildDay(
  dayNumber: number,
  focusKey: string,
  slots: MuscleGroup[][],
  pool: Exercise[],
  input: PlanInput,
  rotation: number
): GeneratedDay {
  const used = new Set<string>();
  const items: PlannedExercise[] = [];

  slots.forEach((groups, slotIndex) => {
    const candidates = pool.filter((e) => groups.includes(e.muscleGroup) && !used.has(e.id));
    if (candidates.length === 0) return;
    const pick = candidates[(rotation + slotIndex) % candidates.length];
    used.add(pick.id);
    items.push({
      exerciseId: pick.id,
      sets: SETS_PER_GOAL[input.goal],
      reps: pick.reps.endsWith('s') ? pick.reps : REPS_PER_GOAL[input.goal],
    });
  });

  return { id: `day_${dayNumber}`, dayNumber, focusKey, items };
}

export function generatePlan(input: PlanInput): GeneratedPlan {
  const pool = poolFor(input.equipment);
  const dayCount = DAYS_PER_LEVEL[input.activityLevel];

  const days: GeneratedDay[] = [];
  if (dayCount <= 3) {
    for (let i = 0; i < dayCount; i++) {
      days.push(buildDay(i + 1, 'training.focusFull', FULL_BODY_SLOTS, pool, input, i));
    }
  } else {
    // 4 days: upper / lower / upper / lower
    days.push(buildDay(1, 'training.focusUpper', UPPER_SLOTS, pool, input, 0));
    days.push(buildDay(2, 'training.focusLower', LOWER_SLOTS, pool, input, 0));
    days.push(buildDay(3, 'training.focusUpper', UPPER_SLOTS, pool, input, 1));
    days.push(buildDay(4, 'training.focusLower', LOWER_SLOTS, pool, input, 1));
  }

  return { days, equipment: input.equipment, generatedAt: new Date().toISOString() };
}
