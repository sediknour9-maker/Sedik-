import type { FoodItem } from '../models/food';

/**
 * Looks up a barcode in the OpenFoodFacts database and maps it to a FoodItem
 * with a 100g default portion. Requires network access — callers must handle
 * the null result (offline, blocked, or unknown product) and offer manual
 * custom-food creation instead.
 */
export async function lookupBarcode(barcode: string): Promise<{ name: string; food: FoodItem } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,nutriments`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!response.ok) return null;

    const json = await response.json();
    const product = json?.product;
    const nutriments = product?.nutriments;
    if (!product?.product_name || !nutriments) return null;

    const kcal = Number(nutriments['energy-kcal_100g']);
    if (!Number.isFinite(kcal) || kcal < 0) return null;

    const food: FoodItem = {
      id: `barcode_${barcode}`,
      nameKey: `custom.${barcode}`, // resolved via customName below, not i18n
      category: 'other',
      portionUnits: [{ key: 'g100', labelKey: 'portion.g100', gramsEquivalent: 100, isDefault: true }],
      perPortion: {
        kcal: Math.round(kcal),
        proteinG: Math.round((Number(nutriments.proteins_100g) || 0) * 10) / 10,
        carbsG: Math.round((Number(nutriments.carbohydrates_100g) || 0) * 10) / 10,
        fatG: Math.round((Number(nutriments.fat_100g) || 0) * 10) / 10,
      },
      isCustom: true,
    };

    return { name: String(product.product_name), food };
  } catch {
    return null;
  }
}
