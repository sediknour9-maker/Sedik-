import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { CalorieSummary } from '../../src/components/CalorieSummary';
import { DateNavigator } from '../../src/components/DateNavigator';
import { MacroBars } from '../../src/components/MacroBars';
import { MealCard } from '../../src/components/MealCard';
import { RamadanBanner } from '../../src/components/RamadanBanner';
import { WaterTracker } from '../../src/components/WaterTracker';
import { Card } from '../../src/components/ui/Card';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { aggregateMacros } from '../../src/services/logRepository';
import { getMealSlotsFor, isRamadanActive } from '../../src/services/ramadanService';
import { useActivity } from '../../src/store/ActivityContext';
import { useFoodDb } from '../../src/store/FoodDbContext';
import { useLogs } from '../../src/store/LogContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useSettings } from '../../src/store/SettingsContext';
import { colors } from '../../src/theme/colors';

export default function NutritionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useProfile();
  const { ramadanOverride } = useSettings();
  const { today, selectedDate, setSelectedDate, entries } = useLogs();
  const { todayActivities } = useActivity();
  const { foods } = useFoodDb();

  const ramadanActive = isRamadanActive(selectedDate, ramadanOverride);
  const consumed = useMemo(() => aggregateMacros(entries), [entries]);

  // The active slots, plus any slot that already holds food, so toggling Ramadan mode never hides entries.
  const mealSlots = useMemo(() => {
    const active = getMealSlotsFor(selectedDate, ramadanOverride);
    const extra = entries.map((entry) => entry.mealSlot).filter((slot) => !active.includes(slot));
    return [...active, ...Array.from(new Set(extra))];
  }, [selectedDate, ramadanOverride, entries]);

  // Burned calories are only tracked per activity day; show them for today.
  const burnedKcal =
    selectedDate === today ? todayActivities.reduce((sum, activity) => sum + (activity.kcalBurned ?? 0), 0) : undefined;

  if (!profile) return null;

  return (
    <Screen>
      <ScreenHeader title={t('nutrition.title')} />
      <DateNavigator date={selectedDate} today={today} onChange={setSelectedDate} />

      {ramadanActive ? <RamadanBanner /> : null}

      <Card style={{ gap: 18 }}>
        <CalorieSummary consumedKcal={consumed.kcal} goalKcal={profile.targets.kcal} burnedKcal={burnedKcal} />
        <View style={styles.divider} />
        <MacroBars consumed={consumed} targets={profile.targets} />
      </Card>

      {mealSlots.map((slot) => (
        <MealCard
          key={slot}
          slot={slot}
          entries={entries.filter((entry) => entry.mealSlot === slot)}
          foods={foods}
          onAdd={() => router.push({ pathname: '/add-food', params: { mealSlot: slot, date: selectedDate } })}
          onEditEntry={(entry) =>
            router.push({
              pathname: '/add-food/[foodId]',
              params: { foodId: entry.foodId, entryId: entry.id, date: entry.date },
            })
          }
        />
      ))}

      <WaterTracker date={selectedDate} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
