import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogs } from '../../src/store/LogContext';
import { useActivity } from '../../src/store/ActivityContext';
import { getLogsForDate, aggregateMacros } from '../../src/services/logRepository';
import { getActivitiesForDate } from '../../src/services/activityRepository';
import type { ActivityType } from '../../src/models/training';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';

interface DayTotal {
  date: string;
  kcal: number;
}

export default function ProgressScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { logDates } = useLogs();
  const { weights, logWeight, activityDates } = useActivity();
  const [weightInput, setWeightInput] = useState('');
  const [dayTotals, setDayTotals] = useState<DayTotal[]>([]);
  const [activityCounts, setActivityCounts] = useState<Record<ActivityType, number>>({
    strength: 0,
    cardio: 0,
    mobility: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const totals = await Promise.all(
        logDates
          .slice()
          .reverse()
          .map(async (date) => {
            const entries = await getLogsForDate(date);
            return { date, kcal: aggregateMacros(entries).kcal };
          })
      );
      if (!cancelled) setDayTotals(totals);
    })();
    return () => {
      cancelled = true;
    };
  }, [logDates]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const counts: Record<ActivityType, number> = { strength: 0, cardio: 0, mobility: 0 };
      const perDate = await Promise.all(activityDates.map((date) => getActivitiesForDate(date)));
      perDate.flat().forEach((entry) => {
        counts[entry.type] += 1;
      });
      if (!cancelled) setActivityCounts(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [activityDates]);

  const handleLogWeight = async () => {
    const value = Number(weightInput.replace(',', '.'));
    if (!value || value <= 0) return;
    await logWeight(value);
    setWeightInput('');
  };

  const recentWeights = weights.slice().reverse().slice(0, 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('progress.title')}</Text>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>{t('progress.statsTitle')}</Text>
          <View style={[styles.statRow, { flexDirection: rowDirection(isRTL) }]}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{activityCounts.strength}</Text>
              <Text style={styles.statLabel}>{t('progress.totalWorkouts')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{activityCounts.cardio}</Text>
              <Text style={styles.statLabel}>{t('progress.totalCardio')}</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{activityCounts.mobility}</Text>
              <Text style={styles.statLabel}>{t('progress.totalMobility')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>{t('progress.weightTitle')}</Text>
          <View style={[styles.weightInputRow, { flexDirection: rowDirection(isRTL) }]}>
            <TextInput
              style={[styles.input, { textAlign: textAlign(isRTL) }]}
              keyboardType="numeric"
              placeholder={t('progress.weightPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={weightInput}
              onChangeText={setWeightInput}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleLogWeight}>
              <Text style={styles.addButtonText}>{t('progress.addWeight')}</Text>
            </TouchableOpacity>
          </View>
          {recentWeights.map((entry) => (
            <View key={entry.date} style={[styles.listRow, { flexDirection: rowDirection(isRTL) }]}>
              <Text style={styles.listDate}>{entry.date}</Text>
              <Text style={styles.listValue}>{entry.weightKg} kg</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>{t('progress.nutritionHistory')}</Text>
          {dayTotals.length === 0 ? (
            <Text style={styles.empty}>{t('history.noHistory')}</Text>
          ) : (
            dayTotals.map((item) => (
              <View key={item.date} style={[styles.listRow, { flexDirection: rowDirection(isRTL) }]}>
                <Text style={styles.listDate}>{item.date}</Text>
                <Text style={styles.listValue}>
                  {Math.round(item.kcal)} {t('common.kcal')}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  statRow: { gap: 10 },
  statTile: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  weightInputRow: { gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  listRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  listDate: { fontSize: 13, color: colors.text, fontVariant: ['tabular-nums'] },
  listValue: { fontSize: 13, color: colors.primaryDark, fontWeight: '600', fontVariant: ['tabular-nums'] },
  empty: { color: colors.textMuted, fontStyle: 'italic' },
});
