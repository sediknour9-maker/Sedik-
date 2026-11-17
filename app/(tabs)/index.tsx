import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { CalorieSummary } from '../../src/components/CalorieSummary';
import { MacroBars } from '../../src/components/MacroBars';
import { RamadanBanner } from '../../src/components/RamadanBanner';
import { WaterTracker } from '../../src/components/WaterTracker';
import { WeekStrip } from '../../src/components/WeekStrip';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chevron } from '../../src/components/ui/Chevron';
import { Icon, type IconName } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { Txt } from '../../src/components/ui/Txt';
import { EXERCISES, MOBILITY_ROUTINE } from '../../src/data/exercises';
import { formatDate, lastNDates } from '../../src/services/date';
import { aggregateMacros } from '../../src/services/logRepository';
import { estimateDayMinutes } from '../../src/services/planGenerator';
import { isRamadanActive, suggestMealSlot } from '../../src/services/ramadanService';
import { computeStreak } from '../../src/services/streakService';
import { WATER_GOAL_GLASSES } from '../../src/services/waterRepository';
import { useActivity } from '../../src/store/ActivityContext';
import { useLogs } from '../../src/store/LogContext';
import { usePlan } from '../../src/store/PlanContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useSettings } from '../../src/store/SettingsContext';
import { useWater } from '../../src/store/WaterContext';
import { colors, type Tone } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/tokens';

const MOBILITY_MINUTES = Math.round(MOBILITY_ROUTINE.reduce((sum, item) => sum + item.durationSec, 0) / 60);

function greetingKey(hour: number): string {
  if (hour >= 5 && hour < 12) return 'home.greetingMorning';
  if (hour >= 12 && hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

interface QuickActionProps {
  icon: IconName;
  tone: Tone;
  label: string;
  onPress: () => void;
  testID: string;
}

function QuickAction({ icon, tone, label, onPress, testID }: QuickActionProps) {
  return (
    <Card onPress={onPress} style={styles.quickAction} testID={testID}>
      <IconBadge icon={icon} tone={tone} size={42} />
      <Txt variant="label" center numberOfLines={1}>
        {label}
      </Txt>
    </Card>
  );
}

interface GoalRowProps {
  icon: IconName;
  tone: Tone;
  label: string;
  detail?: string;
  done: boolean;
  onPress?: () => void;
  testID: string;
}

function GoalRow({ icon, tone, label, detail, done, onPress, testID }: GoalRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ checked: done }}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      <Row gap={12} style={styles.goalRow}>
        <IconBadge icon={icon} tone={done ? 'secondary' : tone} size={38} />
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" color={done ? colors.textMuted : colors.text}>
            {label}
          </Txt>
          {detail ? (
            <Txt variant="caption" color={colors.textMuted}>
              {detail}
            </Txt>
          ) : null}
        </View>
        <Icon
          name={done ? 'checkCircle' : 'circle'}
          size={24}
          color={done ? colors.secondaryLight : colors.border}
        />
      </Row>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile } = useProfile();
  const { ramadanOverride } = useSettings();
  const { today, todayEntries, logDates } = useLogs();
  const { todayActivities, activityDates, activityCounts } = useActivity();
  const { plan } = usePlan();
  const { glasses } = useWater(today);

  const hour = new Date().getHours();
  const consumed = useMemo(() => aggregateMacros(todayEntries), [todayEntries]);
  const kcalBurned = todayActivities.reduce((sum, activity) => sum + (activity.kcalBurned ?? 0), 0);
  const ramadanActive = isRamadanActive(today, ramadanOverride);

  const activeDates = useMemo(() => Array.from(new Set([...logDates, ...activityDates])), [logDates, activityDates]);
  const streak = useMemo(() => computeStreak(activeDates, today), [activeDates, today]);
  const activeThisWeek = lastNDates(today, 7).filter((date) => activeDates.includes(date)).length;

  // Show the workout finished today; otherwise the next one in the plan's rotation.
  const finishedToday = todayActivities.find((activity) => activity.type === 'strength');
  const workoutDay = plan?.days.length
    ? (finishedToday && plan.days.find((day) => day.id === finishedToday.refId)) ||
      plan.days[activityCounts.strength % plan.days.length]
    : null;

  const foodDone = todayEntries.length > 0;
  const workoutDone = !!finishedToday;
  const mobilityDone = todayActivities.some((activity) => activity.type === 'mobility');
  const waterDone = glasses >= WATER_GOAL_GLASSES;
  const goalsDone = [foodDone, workoutDone, mobilityDone, waterDone].filter(Boolean).length;

  if (!profile) return null;

  const logFood = () =>
    router.push({ pathname: '/add-food', params: { mealSlot: suggestMealSlot(hour, ramadanActive), date: today } });

  return (
    <Screen>
      <Row justify="space-between" align="flex-start">
        <View style={{ flex: 1 }}>
          <Txt variant="label" color={colors.textMuted}>
            {formatDate(today, i18n.language, 'full')}
          </Txt>
          <Txt variant="title">{t(greetingKey(hour))}</Txt>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/progress')}
          accessibilityRole="button"
          accessibilityLabel={t('home.streakLabel', { count: streak })}
          testID="home-streak"
        >
          <Row gap={6} style={styles.streakPill}>
            <Icon name="flame" size={18} color={colors.orange} fill={streak > 0 ? colors.orange : 'none'} />
            <Txt variant="subheading" tabular>
              {streak}
            </Txt>
          </Row>
        </Pressable>
      </Row>

      {ramadanActive ? <RamadanBanner /> : null}

      <Card onPress={() => router.push('/(tabs)/nutrition')} style={{ gap: 18 }} testID="home-calories">
        <Row justify="space-between">
          <Txt variant="heading">{t('home.calories')}</Txt>
          <Chevron />
        </Row>
        <CalorieSummary consumedKcal={consumed.kcal} goalKcal={profile.targets.kcal} burnedKcal={kcalBurned} />
        <View style={styles.divider} />
        <MacroBars consumed={consumed} targets={profile.targets} />
      </Card>

      <Row gap={10} align="stretch">
        <QuickAction icon="utensils" tone="primary" label={t('home.quickLog')} onPress={logFood} testID="quick-log" />
        <QuickAction
          icon="barcode"
          tone="violet"
          label={t('home.quickScan')}
          onPress={() =>
            router.push({
              pathname: '/scan-barcode',
              params: { mealSlot: suggestMealSlot(hour, ramadanActive), date: today },
            })
          }
          testID="quick-scan"
        />
        <QuickAction
          icon="scale"
          tone="info"
          label={t('home.quickWeight')}
          onPress={() => router.push('/(tabs)/progress')}
          testID="quick-weight"
        />
      </Row>

      {workoutDay ? (
        <Card style={{ gap: 14 }} testID="home-workout">
          <Row gap={12}>
            <IconBadge icon="dumbbell" tone="primary" size={46} />
            <View style={{ flex: 1 }}>
              <Txt variant="caption" color={colors.textMuted}>
                {t('home.todaysTraining')}
              </Txt>
              <Txt variant="heading">
                {t('training.day', { n: workoutDay.dayNumber })} · {t(workoutDay.focusKey)}
              </Txt>
            </View>
          </Row>
          <Row gap={16}>
            <Row gap={6}>
              <Icon name="dumbbell" size={15} color={colors.textMuted} />
              <Txt variant="caption" color={colors.textMuted}>
                {t('home.exerciseCount', { count: workoutDay.items.length })}
              </Txt>
            </Row>
            <Row gap={6}>
              <Icon name="clock" size={15} color={colors.textMuted} />
              <Txt variant="caption" color={colors.textMuted}>
                {t('home.durationApprox', { minutes: estimateDayMinutes(workoutDay) })}
              </Txt>
            </Row>
          </Row>
          <Txt variant="caption" color={colors.textDim} numberOfLines={2}>
            {workoutDay.items
              .map((item) => EXERCISES.find((exercise) => exercise.id === item.exerciseId))
              .filter((exercise) => !!exercise)
              .map((exercise) => t(exercise!.nameKey))
              .join(' · ')}
          </Txt>
          {workoutDone ? (
            <Row gap={8} style={styles.doneBanner}>
              <Icon name="checkCircle" size={20} color={colors.secondaryLight} />
              <Txt variant="label" color={colors.secondaryLight}>
                {t('training.workoutDone')}
              </Txt>
            </Row>
          ) : (
            <Button
              label={t('home.startWorkout')}
              icon="play"
              onPress={() => router.push('/(tabs)/training')}
              testID="home-start-workout"
            />
          )}
        </Card>
      ) : null}

      <Card style={{ gap: 2 }}>
        <Row justify="space-between" style={{ marginBottom: 6 }}>
          <Txt variant="heading">{t('home.dailyGoals')}</Txt>
          <Txt variant="label" color={colors.textMuted} tabular>
            {goalsDone} / 4
          </Txt>
        </Row>
        <GoalRow
          icon="utensils"
          tone="primary"
          label={t('home.goalFood')}
          detail={`${Math.round(consumed.kcal)} / ${profile.targets.kcal} ${t('common.kcal')}`}
          done={foodDone}
          onPress={() => router.push('/(tabs)/nutrition')}
          testID="goal-food"
        />
        <GoalRow
          icon="dumbbell"
          tone="orange"
          label={t('home.goalWorkout')}
          detail={workoutDay ? `${t('training.day', { n: workoutDay.dayNumber })} · ${t(workoutDay.focusKey)}` : undefined}
          done={workoutDone}
          onPress={() => router.push('/(tabs)/training')}
          testID="goal-workout"
        />
        <GoalRow
          icon="person"
          tone="violet"
          label={t('home.goalMobility')}
          detail={t('home.durationApprox', { minutes: MOBILITY_MINUTES })}
          done={mobilityDone}
          onPress={() => router.push({ pathname: '/(tabs)/training', params: { segment: 'mobility' } })}
          testID="goal-mobility"
        />
        <GoalRow
          icon="droplet"
          tone="info"
          label={t('home.goalWater')}
          detail={t('water.progress', { count: glasses, goal: WATER_GOAL_GLASSES })}
          done={waterDone}
          testID="goal-water"
        />
      </Card>

      <WaterTracker date={today} />

      <Card style={{ gap: 14 }}>
        <Row justify="space-between">
          <Txt variant="heading">{t('home.thisWeek')}</Txt>
          <Txt variant="label" color={colors.textMuted}>
            {t('home.activeDays', { count: activeThisWeek })}
          </Txt>
        </Row>
        <WeekStrip today={today} activeDates={activeDates} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  quickAction: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  goalRow: { paddingVertical: 8 },
  doneBanner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.secondarySoft,
  },
});
