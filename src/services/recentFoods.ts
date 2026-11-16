const MAX_RECENT_FOODS = 12;

/** Moves foodId to the front of the most-recently-used list, without duplicates. */
export function pushRecentFood(recentIds: string[], foodId: string): string[] {
  return [foodId, ...recentIds.filter((id) => id !== foodId)].slice(0, MAX_RECENT_FOODS);
}
