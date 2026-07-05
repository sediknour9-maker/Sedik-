export type FoodCategory =
  | 'tagine'
  | 'soup'
  | 'bread_pastry'
  | 'couscous'
  | 'drink'
  | 'sweet'
  | 'grill'
  | 'other';

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface PortionUnit {
  key: string;
  labelKey: string;
  gramsEquivalent: number;
  isDefault?: boolean;
}

export interface FoodItem {
  id: string;
  nameKey: string;
  category: FoodCategory;
  portionUnits: PortionUnit[];
  perPortion: Macros;
  isCustom?: boolean;
  region?: 'morocco' | 'generic';
}
