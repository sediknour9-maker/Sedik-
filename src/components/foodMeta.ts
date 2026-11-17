import type { FoodCategory } from '../models/food';
import type { Tone } from '../theme/colors';
import type { IconName } from './ui/Icon';

/** Icon, color and label per food category, used for list icons and filter chips. */
export const FOOD_CATEGORY_META: Record<FoodCategory, { icon: IconName; tone: Tone; labelKey: string }> = {
  tagine: { icon: 'tagine', tone: 'primary', labelKey: 'browse.categoryTagine' },
  soup: { icon: 'soup', tone: 'orange', labelKey: 'browse.categorySoup' },
  bread_pastry: { icon: 'croissant', tone: 'accent', labelKey: 'browse.categoryBreadPastry' },
  couscous: { icon: 'wheat', tone: 'accent', labelKey: 'browse.categoryCouscous' },
  drink: { icon: 'glass', tone: 'info', labelKey: 'browse.categoryDrink' },
  sweet: { icon: 'cookie', tone: 'pink', labelKey: 'browse.categorySweet' },
  grill: { icon: 'drumstick', tone: 'orange', labelKey: 'browse.categoryGrill' },
  other: { icon: 'salad', tone: 'secondary', labelKey: 'browse.categoryOther' },
};

export const FOOD_CATEGORIES = Object.keys(FOOD_CATEGORY_META) as FoodCategory[];
