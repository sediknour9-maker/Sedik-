import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../../src/store/ProfileContext';
import { useLogs } from '../../src/store/LogContext';
import { useActivity } from '../../src/store/ActivityContext';
import { usePlan } from '../../src/store/PlanContext';
import { aggregateMacros } from '../../src/services/logRepository';
import { computeStreak } from '../../src/services/streakService';
import { todayString } from '../../src/services/date';
import { EXERCISES } from '../../src/data/exercises';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';

function GoalRow({ label, done }: { label: string; done: boolean }) {
  const isRTL = useRTL();
  return (
    <View style={[styles.goalRow, { flexDirection: rowDirection(isRTL) }]}>
      <Text style={[styles.goalCheck, done && styles.goalCheckDone]}>{done ? '✓' : '○'}</Text>
      <Text style={[styles.goalLabel, { textAlign: textAlign(isRTL) }, done && styles.goalLabelDone]}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { profile } = useProfile();
  const { entries, logDates } = useLogs();
  const { todayActivities, activityDates } = useActivity();
  const { plan } = usePlan();

  const today = todayString();
  const consumed = useMemo(() => aggregateMacros(entries), [entries]);

  const streak = useMemo(() => {
    const active = Array.from(new Set([...logDates, ...activityDates]));
    return computeStreak(active, today);
  }, [logDates, activityDates, today]);

  const foodDone = entries.length > 0;
  const workoutDone = todayActivities.some((a) => a.type === 'strength');
  const mobilityDone = todayActivities.some((a) => a.type === 'mobility');
  const kcalBurned = todayActivities.reduce((sum, a) => sum + (a.kcalBurned ?? 0), 0);

  // Rotate through the generated plan based on days with logged activity
  const suggestedDay = plan?.days.length ? plan.days[activityDates.length % plan.days.length] : null;

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.headerRow, { flexDirection: rowDirection(isRTL) }]}>
          <Text style={styles.title}>{t('common.today')}</Text>
          <View style={[styles.streakBadge, { flexDirection: rowDirection(isRTL) }]}>
            <Text style={styles.streakFlame}>🔥</Text>
            <Text style={styles.streakText}>
              {streak} {t('home.streak')}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>{t('home.dailyGoals')}</Text>
          <GoalRow label={t('home.goalFood')} done={foodDone} />
          <GoalRow label={t('home.goalWorkout')} done={workoutDone} />
          <GoalRow label={t('home.goalMobility')} done={mobilityDone} />
        </View>

        <View style={[styles.statRow, { flexDirection: rowDirection(isRTL) }]}>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{Math.round(consumed.kcal)}</Text>
            <Text style={styles.statLabel}>{t('home.nutritionToday')}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{kcalBurned}</Text>
            <Text style={styles.statLabel}>{t('home.kcalBurnedToday')}</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statValue}>{profile.targets.kcal}</Text>
            <Text style={styles.statLabel}>{t('dashboard.caloriesGoal')}</Text>
          </View>
        </View>

        {suggestedDay ? (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>{t('home.todaysTraining')}</Text>
            <Text style={[styles.trainingDay, { textAlign: textAlign(isRTL) }]}>
              {t('training.day', { n: suggestedDay.dayNumber })} · {t(suggestedDay.focusKey)}
            </Text>
            {suggestedDay.items.slice(0, 3).map((item) => {
              const exercise = EXERCISES.find((e) => e.id === item.exerciseId);
              return exercise ? (
                <Text key={item.exerciseId} style={[styles.trainingExercise, { textAlign: textAlign(isRTL) }]}>
                  • {t(exercise.nameKey)}
                </Text>
              ) : null;
            })}
            <TouchableOpacity style={styles.trainingButton} onPress={() => router.push('/(tabs)/training')}>
              <Text style={styles.trainingButtonText}>{t('home.goToTraining')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  streakBadge: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakFlame: { fontSize: 16 },
  streakText: { fontSize: 13, fontWeight: '700', color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  goalRow: { alignItems: 'center', gap: 10, paddingVertical: 6 },
  goalCheck: { fontSize: 16, color: colors.textMuted, width: 22, textAlign: 'center' },
  goalCheckDone: { color: colors.secondary, fontWeight: '700' },
  goalLabel: { fontSize: 14, color: colors.text, flex: 1 },
  goalLabelDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  statRow: { gap: 10, marginBottom: 16 },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, textAlign: 'center' },
  trainingDay: { fontSize: 15, fontWeight: '600', color: colors.primaryDark, marginBottom: 6 },
  trainingExercise: { fontSize: 13, color: colors.textMuted, marginBottom: 2 },
  trainingButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  trainingButtonText: { color: '#fff', fontWeight: '700' },
});
