import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { useRTL, rowDirection, textAlign } from '../theme/rtl';
import { getFoodName } from '../services/foodRepository';
import { FoodListItem } from './FoodListItem';
import type { LogEntry, MealSlot } from '../models/log';
import type { FoodItem } from '../models/food';

const MEAL_SLOT_KEY: Record<MealSlot, string> = {
  breakfast: 'dashboard.mealSlotBreakfast',
  lunch: 'dashboard.mealSlotLunch',
  dinner: 'dashboard.mealSlotDinner',
  snack: 'dashboard.mealSlotSnack',
  suhoor: 'dashboard.mealSlotSuhoor',
  iftar: 'dashboard.mealSlotIftar',
};

interface MealSlotCardProps {
  mealSlot: MealSlot;
  entries: LogEntry[];
  foods: FoodItem[];
  onAddPress: () => void;
  onRemoveEntry: (entryId: string) => void;
}

export function MealSlotCard({ mealSlot, entries, foods, onAddPress, onRemoveEntry }: MealSlotCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const total = entries.reduce((sum, entry) => sum + entry.computed.kcal, 0);

  return (
    <View style={styles.card}>
      <View style={[styles.header, { flexDirection: rowDirection(isRTL) }]}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t(MEAL_SLOT_KEY[mealSlot])}</Text>
        <Text style={styles.total}>{Math.round(total)} kcal</Text>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.empty}>{t('dashboard.noEntries')}</Text>
      ) : (
        entries.map((entry) => {
          const food = foods.find((f) => f.id === entry.foodId);
          return (
            <FoodListItem
              key={entry.id}
              title={food ? getFoodName(food, t) : entry.foodId}
              subtitle={`x${entry.multiplier}`}
              kcal={entry.computed.kcal}
              onRemove={() => onRemoveEntry(entry.id)}
            />
          );
        })
      )}

      <TouchableOpacity style={styles.addButton} onPress={onAddPress}>
        <Text style={styles.addButtonText}>+ {t('dashboard.addFood')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  total: { fontSize: 13, color: colors.textMuted },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  addButton: { paddingVertical: 8, alignItems: 'center' },
  addButtonText: { color: colors.primary, fontWeight: '600' },
});
