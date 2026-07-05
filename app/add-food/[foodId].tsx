import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFoodDb } from '../../src/store/FoodDbContext';
import { useLogs } from '../../src/store/LogContext';
import { useSettings } from '../../src/store/SettingsContext';
import { computeMacrosForPortion } from '../../src/services/foodRepository';
import { getMealSlotsFor } from '../../src/services/ramadanService';
import { todayString } from '../../src/services/date';
import { PortionPicker } from '../../src/components/PortionPicker';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';
import type { MealSlot } from '../../src/models/log';

const MEAL_SLOT_LABEL_KEY: Record<MealSlot, string> = {
  breakfast: 'dashboard.mealSlotBreakfast',
  lunch: 'dashboard.mealSlotLunch',
  dinner: 'dashboard.mealSlotDinner',
  snack: 'dashboard.mealSlotSnack',
  suhoor: 'dashboard.mealSlotSuhoor',
  iftar: 'dashboard.mealSlotIftar',
};

export default function PortionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { foodId, mealSlot: mealSlotParam, date: dateParam } = useLocalSearchParams<{
    foodId: string;
    mealSlot?: string;
    date?: string;
  }>();
  const { foods } = useFoodDb();
  const { addEntry } = useLogs();
  const { ramadanOverride } = useSettings();

  const food = foods.find((f) => f.id === foodId);
  const date = dateParam ?? todayString();
  const availableSlots = useMemo(() => getMealSlotsFor(date, ramadanOverride), [date, ramadanOverride]);
  const [mealSlot, setMealSlot] = useState<MealSlot>(
    (mealSlotParam as MealSlot) ?? availableSlots[0]
  );

  const [portionUnitKey, setPortionUnitKey] = useState(
    food?.portionUnits.find((u) => u.isDefault)?.key ?? food?.portionUnits[0]?.key ?? ''
  );
  const [multiplier, setMultiplier] = useState(1);

  if (!food) return null;

  const computed = computeMacrosForPortion(food, portionUnitKey, multiplier);

  const handleConfirm = async () => {
    await addEntry({
      id: `${Date.now()}`,
      date,
      mealSlot,
      foodId: food.id,
      portionUnitKey,
      multiplier,
      computed,
      loggedAt: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t(food.nameKey)}</Text>

        <Text style={styles.sectionLabel}>{t('addFood.selectMealSlot')}</Text>
        <View style={[styles.slotRow, { flexDirection: rowDirection(isRTL) }]}>
          {availableSlots.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slotChip, mealSlot === slot && styles.slotChipActive]}
              onPress={() => setMealSlot(slot)}
            >
              <Text style={[styles.slotChipText, mealSlot === slot && styles.slotChipTextActive]}>
                {t(MEAL_SLOT_LABEL_KEY[slot])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <PortionPicker
          food={food}
          portionUnitKey={portionUnitKey}
          multiplier={multiplier}
          onChangePortionUnit={setPortionUnitKey}
          onChangeMultiplier={setMultiplier}
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryKcal}>
            {computed.kcal} {t('common.kcal')}
          </Text>
          <View style={[styles.summaryRow, { flexDirection: rowDirection(isRTL) }]}>
            <Text style={styles.summaryText}>
              {t('common.protein')}: {computed.proteinG}g
            </Text>
            <Text style={styles.summaryText}>
              {t('common.carbs')}: {computed.carbsG}g
            </Text>
            <Text style={styles.summaryText}>
              {t('common.fat')}: {computed.fatG}g
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>{t('addFood.confirmAdd')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  slotRow: { gap: 8, flexWrap: 'wrap' },
  slotChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  slotChipText: { color: colors.text, fontSize: 13 },
  slotChipTextActive: { color: '#fff', fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 24,
  },
  summaryKcal: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: 10 },
  summaryRow: { justifyContent: 'space-around' },
  summaryText: { fontSize: 13, color: colors.textMuted },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
