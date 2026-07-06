import type { Exercise, WorkoutDay, MobilityExercise, CardioActivity } from '../models/training';

/** Strength exercise pool used by the 3-day full-body plan. */
export const EXERCISES: Exercise[] = [
  { id: 'squat', nameKey: 'exercise.squat', muscleGroup: 'legs', equipment: 'barbell', sets: 3, reps: '8-12' },
  { id: 'lunge', nameKey: 'exercise.lunge', muscleGroup: 'legs', equipment: 'bodyweight', sets: 3, reps: '10-12' },
  { id: 'leg_press', nameKey: 'exercise.leg_press', muscleGroup: 'legs', equipment: 'machine', sets: 3, reps: '10-12' },
  { id: 'romanian_deadlift', nameKey: 'exercise.romanian_deadlift', muscleGroup: 'legs', equipment: 'barbell', sets: 3, reps: '8-10' },
  { id: 'bench_press', nameKey: 'exercise.bench_press', muscleGroup: 'chest', equipment: 'barbell', sets: 3, reps: '8-12' },
  { id: 'pushup', nameKey: 'exercise.pushup', muscleGroup: 'chest', equipment: 'bodyweight', sets: 3, reps: '10-15' },
  { id: 'incline_dumbbell_press', nameKey: 'exercise.incline_dumbbell_press', muscleGroup: 'chest', equipment: 'dumbbell', sets: 3, reps: '8-12' },
  { id: 'pullup', nameKey: 'exercise.pullup', muscleGroup: 'back', equipment: 'bodyweight', sets: 3, reps: '6-10' },
  { id: 'lat_pulldown', nameKey: 'exercise.lat_pulldown', muscleGroup: 'back', equipment: 'machine', sets: 3, reps: '10-12' },
  { id: 'barbell_row', nameKey: 'exercise.barbell_row', muscleGroup: 'back', equipment: 'barbell', sets: 3, reps: '8-12' },
  { id: 'overhead_press', nameKey: 'exercise.overhead_press', muscleGroup: 'shoulders', equipment: 'barbell', sets: 3, reps: '8-12' },
  { id: 'lateral_raise', nameKey: 'exercise.lateral_raise', muscleGroup: 'shoulders', equipment: 'dumbbell', sets: 3, reps: '12-15' },
  { id: 'biceps_curl', nameKey: 'exercise.biceps_curl', muscleGroup: 'arms', equipment: 'dumbbell', sets: 3, reps: '10-12' },
  { id: 'triceps_dip', nameKey: 'exercise.triceps_dip', muscleGroup: 'arms', equipment: 'bodyweight', sets: 3, reps: '8-12' },
  { id: 'plank', nameKey: 'exercise.plank', muscleGroup: 'core', equipment: 'bodyweight', sets: 3, reps: '30-60s' },
  { id: 'crunch', nameKey: 'exercise.crunch', muscleGroup: 'core', equipment: 'bodyweight', sets: 3, reps: '15-20' },
  { id: 'hip_thrust', nameKey: 'exercise.hip_thrust', muscleGroup: 'legs', equipment: 'barbell', sets: 3, reps: '10-12' },
  { id: 'deadlift', nameKey: 'exercise.deadlift', muscleGroup: 'fullBody', equipment: 'barbell', sets: 3, reps: '5-8' },
  { id: 'goblet_squat', nameKey: 'exercise.goblet_squat', muscleGroup: 'legs', equipment: 'dumbbell', sets: 3, reps: '10-12' },
  { id: 'split_squat', nameKey: 'exercise.split_squat', muscleGroup: 'legs', equipment: 'bodyweight', sets: 3, reps: '10-12' },
  { id: 'glute_bridge', nameKey: 'exercise.glute_bridge', muscleGroup: 'legs', equipment: 'bodyweight', sets: 3, reps: '12-15' },
  { id: 'dumbbell_row', nameKey: 'exercise.dumbbell_row', muscleGroup: 'back', equipment: 'dumbbell', sets: 3, reps: '8-12' },
];

/** Simple 3-day full-body split. */
export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: 'day_a',
    nameKey: 'training.dayA',
    exerciseIds: ['squat', 'bench_press', 'barbell_row', 'lateral_raise', 'plank'],
  },
  {
    id: 'day_b',
    nameKey: 'training.dayB',
    exerciseIds: ['deadlift', 'overhead_press', 'lat_pulldown', 'biceps_curl', 'crunch'],
  },
  {
    id: 'day_c',
    nameKey: 'training.dayC',
    exerciseIds: ['leg_press', 'incline_dumbbell_press', 'pullup', 'triceps_dip', 'hip_thrust'],
  },
];

export const MOBILITY_ROUTINE: MobilityExercise[] = [
  { id: 'cat_cow', nameKey: 'mobility.cat_cow', targetKey: 'mobility.target_spine', durationSec: 60 },
  { id: 'worlds_greatest_stretch', nameKey: 'mobility.worlds_greatest_stretch', targetKey: 'mobility.target_hips', durationSec: 60 },
  { id: 'hip_flexor_stretch', nameKey: 'mobility.hip_flexor_stretch', targetKey: 'mobility.target_hips', durationSec: 60 },
  { id: 'shoulder_circles', nameKey: 'mobility.shoulder_circles', targetKey: 'mobility.target_shoulders', durationSec: 45 },
  { id: 'thoracic_rotation', nameKey: 'mobility.thoracic_rotation', targetKey: 'mobility.target_spine', durationSec: 60 },
  { id: 'hamstring_stretch', nameKey: 'mobility.hamstring_stretch', targetKey: 'mobility.target_legs', durationSec: 60 },
  { id: 'ankle_mobility', nameKey: 'mobility.ankle_mobility', targetKey: 'mobility.target_ankles', durationSec: 45 },
  { id: 'deep_squat_hold', nameKey: 'mobility.deep_squat_hold', targetKey: 'mobility.target_hips', durationSec: 60 },
];

/** MET values from the Compendium of Physical Activities (approximate). */
export const CARDIO_ACTIVITIES: CardioActivity[] = [
  { id: 'walking', nameKey: 'cardio.walking', met: 3.5 },
  { id: 'running', nameKey: 'cardio.running', met: 9.8 },
  { id: 'cycling', nameKey: 'cardio.cycling', met: 7.5 },
  { id: 'swimming', nameKey: 'cardio.swimming', met: 8.0 },
  { id: 'football', nameKey: 'cardio.football', met: 8.0 },
  { id: 'basketball', nameKey: 'cardio.basketball', met: 6.5 },
  { id: 'boxing', nameKey: 'cardio.boxing', met: 9.0 },
  { id: 'rope_jumping', nameKey: 'cardio.rope_jumping', met: 11.0 },
  { id: 'rowing', nameKey: 'cardio.rowing', met: 7.0 },
  { id: 'hiking', nameKey: 'cardio.hiking', met: 6.0 },
  { id: 'dancing', nameKey: 'cardio.dancing', met: 5.5 },
  { id: 'stairs', nameKey: 'cardio.stairs', met: 8.0 },
];
