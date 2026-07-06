import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../../src/store/ProfileContext';
import { useSettings } from '../../src/store/SettingsContext';
import { useLogs } from '../../src/store/LogContext';
import { useFoodDb } from '../../src/store/FoodDbContext';
import { aggregateMacros } from '../../src/services/logRepository';
import { getMealSlotsFor, isRamadanActive } from '../../src/services/ramadanService';
import { CalorieRing } from '../../src/components/CalorieRing';
import { MacroBar } from '../../src/components/MacroBar';
import { MealSlotCard } from '../../src/components/MealSlotCard';
import { RamadanBanner } from '../../src/components/RamadanBanner';
import { colors } from '../../src/theme/colors';
import { textAlign, useRTL } from '../../src/theme/rtl';

export default function NutritionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { profile } = useProfile();
  const { ramadanOverride } = useSettings();
  const { selectedDate, entries, removeEntry } = useLogs();
  const { foods } = useFoodDb();

  const ramadanActive = isRamadanActive(selectedDate, ramadanOverride);
  // Show the active slot set plus any slot that already has entries, so
  // toggling Ramadan mode never hides logged food from view.
  const mealSlots = useMemo(() => {
    const active = getMealSlotsFor(selectedDate, ramadanOverride);
    const withEntries = entries.map((entry) => entry.mealSlot).filter((slot) => !active.includes(slot));
    return [...active, ...Array.from(new Set(withEntries))];
  }, [selectedDate, ramadanOverride, entries]);
  const consumed = useMemo(() => aggregateMacros(entries), [entries]);

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('nutrition.title')}</Text>

        {ramadanActive ? <RamadanBanner /> : null}

        <View style={styles.ringWrapper}>
          <CalorieRing consumed={consumed.kcal} goal={profile.targets.kcal} unitLabel={t('common.kcal')} />
        </View>

        <View style={styles.macroCard}>
          <MacroBar consumed={consumed} targets={profile.targets} />
        </View>

        {mealSlots.map((slot) => (
          <MealSlotCard
            key={slot}
            mealSlot={slot}
            entries={entries.filter((entry) => entry.mealSlot === slot)}
            foods={foods}
            onAddPress={() => router.push({ pathname: '/add-food', params: { mealSlot: slot, date: selectedDate } })}
            onRemoveEntry={removeEntry}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  ringWrapper: { alignItems: 'center', marginVertical: 16 },
  macroCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
});
