import { computeBMR, computeTDEE, computeTargets } from '../src/services/calorieCalculator';

describe('calorieCalculator', () => {
  const maleProfile = {
    sex: 'male' as const,
    age: 30,
    heightCm: 180,
    weightKg: 80,
    activityLevel: 'moderate' as const,
    goal: 'maintain' as const,
  };

  const femaleProfile = {
    sex: 'female' as const,
    age: 25,
    heightCm: 165,
    weightKg: 60,
    activityLevel: 'light' as const,
    goal: 'lose' as const,
  };

  it('computes BMR using Mifflin-St Jeor for males', () => {
    expect(computeBMR(maleProfile)).toBeCloseTo(1780, 5);
  });

  it('computes BMR using Mifflin-St Jeor for females', () => {
    expect(computeBMR(femaleProfile)).toBeCloseTo(1345.25, 5);
  });

  it('applies the activity multiplier for TDEE', () => {
    expect(computeTDEE(maleProfile)).toBeCloseTo(1780 * 1.55, 5);
  });

  it('computes maintain-goal daily targets with a 30/40/30 macro split', () => {
    const targets = computeTargets(maleProfile);
    expect(targets.kcal).toBe(2759);
    expect(targets.proteinG).toBe(207);
    expect(targets.carbsG).toBe(276);
    expect(targets.fatG).toBe(92);
  });

  it('subtracts 500 kcal for a weight-loss goal', () => {
    const targets = computeTargets(femaleProfile);
    expect(targets.kcal).toBe(1350);
    expect(targets.proteinG).toBe(101);
    expect(targets.carbsG).toBe(135);
    expect(targets.fatG).toBe(45);
  });

  it('adds 350 kcal for a weight-gain goal', () => {
    const targets = computeTargets({ ...maleProfile, goal: 'gain' });
    expect(targets.kcal).toBe(2759 + 350);
  });
});
