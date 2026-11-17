import type { MuscleGroup } from '../models/training';
import type { Tone } from '../theme/colors';
import type { IconName } from './ui/Icon';

/** Icon and color per cardio activity id (see CARDIO_ACTIVITIES). */
export const CARDIO_META: Record<string, { icon: IconName; tone: Tone }> = {
  walking: { icon: 'footprints', tone: 'info' },
  running: { icon: 'shoe', tone: 'orange' },
  cycling: { icon: 'bike', tone: 'secondary' },
  swimming: { icon: 'swim', tone: 'info' },
  football: { icon: 'ball', tone: 'secondary' },
  basketball: { icon: 'ball', tone: 'orange' },
  boxing: { icon: 'fist', tone: 'primary' },
  rope_jumping: { icon: 'jump', tone: 'accent' },
  rowing: { icon: 'kayak', tone: 'info' },
  hiking: { icon: 'mountain', tone: 'secondary' },
  dancing: { icon: 'music', tone: 'pink' },
  stairs: { icon: 'stairs', tone: 'violet' },
};

export const DEFAULT_CARDIO_META = { icon: 'heartPulse' as IconName, tone: 'primary' as Tone };

export const MUSCLE_LABEL_KEYS: Record<MuscleGroup, string> = {
  chest: 'muscle.chest',
  back: 'muscle.back',
  legs: 'muscle.legs',
  shoulders: 'muscle.shoulders',
  arms: 'muscle.arms',
  core: 'muscle.core',
  fullBody: 'muscle.fullBody',
};
