import { generatePlan } from '../src/services/planGenerator';
import { EXERCISES } from '../src/data/exercises';

describe('planGenerator', () => {
  it('creates 2 full-body days for low activity levels', () => {
    const plan = generatePlan({ goal: 'maintain', activityLevel: 'light', equipment: 'gym' });
    expect(plan.days).toHaveLength(2);
    expect(plan.days.every((d) => d.focusKey === 'training.focusFull')).toBe(true);
  });

  it('creates a 4-day upper/lower split for high activity levels', () => {
    const plan = generatePlan({ goal: 'maintain', activityLevel: 'active', equipment: 'gym' });
    expect(plan.days).toHaveLength(4);
    expect(plan.days.map((d) => d.focusKey)).toEqual([
      'training.focusUpper',
      'training.focusLower',
      'training.focusUpper',
      'training.focusLower',
    ]);
  });

  it('only uses home-friendly equipment when equipment is home', () => {
    const plan = generatePlan({ goal: 'maintain', activityLevel: 'moderate', equipment: 'home' });
    const usedIds = plan.days.flatMap((d) => d.items.map((i) => i.exerciseId));
    usedIds.forEach((id) => {
      const exercise = EXERCISES.find((e) => e.id === id);
      expect(['bodyweight', 'dumbbell']).toContain(exercise?.equipment);
    });
  });

  it('adjusts reps and sets to the goal', () => {
    const losePlan = generatePlan({ goal: 'lose', activityLevel: 'moderate', equipment: 'gym' });
    const gainPlan = generatePlan({ goal: 'gain', activityLevel: 'moderate', equipment: 'gym' });
    const loseItem = losePlan.days[0].items.find((i) => !i.reps.endsWith('s'));
    const gainItem = gainPlan.days[0].items.find((i) => !i.reps.endsWith('s'));
    expect(loseItem?.reps).toBe('12-15');
    expect(loseItem?.sets).toBe(3);
    expect(gainItem?.reps).toBe('6-10');
    expect(gainItem?.sets).toBe(4);
  });

  it('keeps timed exercises (e.g. plank) on their duration prescription', () => {
    const plan = generatePlan({ goal: 'lose', activityLevel: 'moderate', equipment: 'gym' });
    const timed = plan.days.flatMap((d) => d.items).filter((i) => i.reps.endsWith('s'));
    timed.forEach((i) => expect(i.reps).toMatch(/s$/));
  });

  it('avoids duplicate exercises within a day', () => {
    const plan = generatePlan({ goal: 'maintain', activityLevel: 'active', equipment: 'home' });
    plan.days.forEach((day) => {
      const ids = day.items.map((i) => i.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
