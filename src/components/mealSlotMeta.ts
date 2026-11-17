import type { MealSlot } from '../models/log';
import type { Tone } from '../theme/colors';
import type { IconName } from './ui/Icon';

/** How each meal slot is labeled and pictured, everywhere slots appear. */
export const MEAL_SLOT_META: Record<MealSlot, { labelKey: string; icon: IconName; tone: Tone }> = {
  breakfast: { labelKey: 'dashboard.mealSlotBreakfast', icon: 'sunrise', tone: 'accent' },
  lunch: { labelKey: 'dashboard.mealSlotLunch', icon: 'sun', tone: 'orange' },
  dinner: { labelKey: 'dashboard.mealSlotDinner', icon: 'sunset', tone: 'primary' },
  snack: { labelKey: 'dashboard.mealSlotSnack', icon: 'cookie', tone: 'pink' },
  suhoor: { labelKey: 'dashboard.mealSlotSuhoor', icon: 'moonStar', tone: 'violet' },
  iftar: { labelKey: 'dashboard.mealSlotIftar', icon: 'moon', tone: 'accent' },
};
