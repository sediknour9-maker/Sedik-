import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { MUSCLE_LABEL_KEYS } from '../../src/components/activityMeta';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { confirmAction } from '../../src/components/ui/confirm';
import { Icon } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { IconButton } from '../../src/components/ui/IconButton';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { useToast } from '../../src/components/ui/Toast';
import { Txt } from '../../src/components/ui/Txt';
import { EXERCISES } from '../../src/data/exercises';
import { getExerciseWeights, saveExerciseWeights } from '../../src/services/activityRepository';
import { computeStrengthKcal } from '../../src/services/cardioCalculator';
import { parseDecimal } from '../../src/services/profileValidation';
import { formatClock, restSecondsFor } from '../../src/services/workoutTiming';
import { useActivity } from '../../src/store/ActivityContext';
import { usePlan } from '../../src/store/PlanContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useInterval } from '../../src/store/useInterval';
import { useToday } from '../../src/store/useToday';
import { colors } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/tokens';
import { useRTL } from '../../src/theme/rtl';
import { hideWebFocusRing } from '../../src/theme/web';
import type { PlannedExercise } from '../../src/models/training';

const EXTRA_REST_SECONDS = 15;

interface ExerciseProgress {
  done: boolean[];
  weight: string;
}

interface WorkoutSummary {
  minutes: number;
  setsDone: number;
  setsTotal: number;
  kcal: number;
}

function emptyProgress(item: PlannedExercise): ExerciseProgress {
  return { done: Array<boolean>(item.sets).fill(false), weight: '' };
}

interface ExerciseCardProps {
  item: PlannedExercise;
  progress: ExerciseProgress;
  expanded: boolean;
  onToggleInfo: () => void;
  onToggleSet: (setIndex: number) => void;
  onWeightChange: (weight: string) => void;
}

function ExerciseCard({ item, progress, expanded, onToggleInfo, onToggleSet, onWeightChange }: ExerciseCardProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const exercise = EXERCISES.find((candidate) => candidate.id === item.exerciseId);
  if (!exercise) return null;

  const allDone = progress.done.every(Boolean);
  const usesWeight = exercise.equipment !== 'bodyweight';
  // The number sits flush against the unit label beside it, on whichever side that is.
  const weightAlign = isRTL ? 'left' : 'right';

  return (
    <Card style={[{ gap: 14 }, allDone && styles.cardDone]} testID={`exercise-${exercise.id}`}>
      <Row gap={12}>
        <IconBadge icon={allDone ? 'check' : 'dumbbell'} tone={allDone ? 'secondary' : 'primary'} size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{t(exercise.nameKey)}</Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t(MUSCLE_LABEL_KEYS[exercise.muscleGroup])} · {item.sets} × {item.reps}
          </Txt>
        </View>
        <IconButton
          icon="info"
          label={t('workout.howTo')}
          size={36}
          color={expanded ? colors.primaryLight : colors.textMuted}
          onPress={onToggleInfo}
        />
      </Row>

      {expanded ? (
        <View style={styles.howTo}>
          <Txt variant="caption" color={colors.textMuted}>
            {t(`exerciseDesc.${exercise.id}`)}
          </Txt>
        </View>
      ) : null}

      <Row gap={10} wrap>
        {progress.done.map((isDone, setIndex) => (
          <Pressable
            key={setIndex}
            onPress={() => onToggleSet(setIndex)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isDone }}
            accessibilityLabel={`${t('workout.set')} ${setIndex + 1}`}
            testID={`set-${exercise.id}-${setIndex + 1}`}
            style={({ pressed }) => [styles.setButton, isDone && styles.setButtonDone, pressed && { opacity: 0.75 }]}
          >
            {isDone ? (
              <Icon name="check" size={20} color={colors.onPrimary} strokeWidth={3} />
            ) : (
              <Txt variant="micro" center color={colors.textMuted}>
                {t('workout.set')} {setIndex + 1}
              </Txt>
            )}
            <Txt variant="label" center tabular color={isDone ? colors.onPrimary : colors.text}>
              {item.reps}
            </Txt>
          </Pressable>
        ))}
      </Row>

      {usesWeight ? (
        <Row gap={10}>
          <Txt variant="label" color={colors.textMuted} style={{ flex: 1 }}>
            {t('workout.weightLabel')}
          </Txt>
          <Row gap={6} style={styles.weightBox}>
            <TextInput
              value={progress.weight}
              onChangeText={onWeightChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textDim}
              accessibilityLabel={`${t(exercise.nameKey)} ${t('workout.weightLabel')}`}
              style={[styles.weightInput, hideWebFocusRing, { textAlign: weightAlign }]}
              testID={`weight-${exercise.id}`}
            />
            <Txt variant="label" color={colors.textMuted}>
              {t('units.kg')}
            </Txt>
          </Row>
        </Row>
      ) : (
        <Txt variant="caption" color={colors.textDim}>
          {t('workout.bodyweight')}
        </Txt>
      )}
    </Card>
  );
}

export default function WorkoutScreen() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const today = useToday();
  const showToast = useToast();
  const { profile } = useProfile();
  const { plan, isLoading } = usePlan();
  const { logActivity } = useActivity();

  const day = plan?.days.find((candidate) => candidate.id === dayId);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);

  useInterval(() => setNow(Date.now()), summary ? null : 1000);

  // Prefill the working weight last used for each exercise.
  useEffect(() => {
    if (!day) return;
    getExerciseWeights().then((saved) => {
      setProgress((current) => {
        const next = { ...current };
        for (const item of day.items) {
          const entry = next[item.exerciseId] ?? emptyProgress(item);
          const lastWeight = saved[item.exerciseId];
          next[item.exerciseId] = entry.weight === '' && lastWeight ? { ...entry, weight: String(lastWeight) } : entry;
        }
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day?.id]);

  if (isLoading || !profile) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!day) return <Redirect href="/(tabs)/training" />;

  const progressFor = (item: PlannedExercise) => progress[item.exerciseId] ?? emptyProgress(item);
  const setsTotal = day.items.reduce((sum, item) => sum + item.sets, 0);
  const setsDone = day.items.reduce((sum, item) => sum + progressFor(item).done.filter(Boolean).length, 0);
  const elapsedSeconds = (now - startedAt) / 1000;
  const restRemaining = restEndsAt ? Math.ceil((restEndsAt - now) / 1000) : 0;
  const isResting = restRemaining > 0;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/training'));

  const toggleSet = (item: PlannedExercise, setIndex: number) => {
    const wasDone = progressFor(item).done[setIndex];
    setProgress((current) => {
      const entry = current[item.exerciseId] ?? emptyProgress(item);
      const done = [...entry.done];
      done[setIndex] = !done[setIndex];
      return { ...current, [item.exerciseId]: { ...entry, done } };
    });
    if (!wasDone) {
      const restSeconds = restSecondsFor(profile.goal);
      setRestTotal(restSeconds);
      setRestEndsAt(Date.now() + restSeconds * 1000);
      setNow(Date.now());
    }
  };

  const setWeight = (item: PlannedExercise, weight: string) =>
    setProgress((current) => ({
      ...current,
      [item.exerciseId]: { ...(current[item.exerciseId] ?? emptyProgress(item)), weight },
    }));

  const extendRest = () => {
    setRestTotal((total) => total + EXTRA_REST_SECONDS);
    setRestEndsAt((end) => (end ?? Date.now()) + EXTRA_REST_SECONDS * 1000);
  };

  const finish = async () => {
    setIsSaving(true);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    const kcal = computeStrengthKcal(profile.weightKg, minutes);
    await logActivity({
      id: `${Date.now()}`,
      date: today,
      type: 'strength',
      refId: day.id,
      durationMin: minutes,
      kcalBurned: kcal,
      setsCompleted: setsDone,
      setsTotal,
      loggedAt: new Date().toISOString(),
    });
    const weights: Record<string, number> = {};
    for (const [exerciseId, entry] of Object.entries(progress)) {
      const weight = parseDecimal(entry.weight);
      if (weight > 0) weights[exerciseId] = weight;
    }
    await saveExerciseWeights(weights);
    showToast(t('workout.saved'));
    setRestEndsAt(null);
    setSummary({ minutes, setsDone, setsTotal, kcal });
    setIsSaving(false);
  };

  const quit = () => {
    if (setsDone === 0) {
      leave();
      return;
    }
    confirmAction({
      title: t('workout.discardTitle'),
      message: t('workout.discardMessage'),
      confirmLabel: t('workout.quit'),
      cancelLabel: t('workout.keepGoing'),
      destructive: true,
      onConfirm: leave,
    });
  };

  const dayTitle = `${t('training.day', { n: day.dayNumber })} · ${t(day.focusKey)}`;

  if (summary) {
    const stats = [
      { label: t('workout.duration'), value: `${summary.minutes} ${t('units.min')}` },
      { label: t('workout.setsDone'), value: `${summary.setsDone}/${summary.setsTotal}` },
      { label: t('common.kcal'), value: `${summary.kcal}` },
    ];
    return (
      <Screen
        edges={['top', 'bottom']}
        contentStyle={styles.summary}
        footer={<Button label={t('workout.done')} size="lg" onPress={leave} testID="workout-done" />}
      >
        <IconBadge icon="trophy" tone="accent" size={96} />
        <View style={{ gap: 6 }}>
          <Txt variant="title" center>
            {t('workout.completeTitle')}
          </Txt>
          <Txt variant="body" center color={colors.textMuted}>
            {dayTitle}
          </Txt>
        </View>
        <Row gap={10} align="stretch" style={{ alignSelf: 'stretch' }}>
          {stats.map((stat) => (
            <Card key={stat.label} style={styles.statTile}>
              <Txt variant="heading" center tabular>
                {stat.value}
              </Txt>
              <Txt variant="micro" center color={colors.textMuted}>
                {stat.label}
              </Txt>
            </Card>
          ))}
        </Row>
        <Txt variant="body" center color={colors.textMuted}>
          {t('workout.completeSubtitle')}
        </Txt>
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <>
          {isResting ? (
            <View style={styles.restBar} testID="rest-timer">
              <Row gap={10}>
                <Icon name="timer" size={20} color={colors.info} />
                <Txt variant="subheading" style={{ flex: 1 }}>
                  {t('workout.rest')}
                </Txt>
                <Txt variant="heading" tabular color={colors.info}>
                  {formatClock(restRemaining)}
                </Txt>
              </Row>
              <ProgressBar progress={restTotal > 0 ? restRemaining / restTotal : 0} color={colors.info} height={6} />
              <Row gap={10}>
                <Button
                  label={`+${EXTRA_REST_SECONDS} s`}
                  variant="secondary"
                  size="sm"
                  onPress={extendRest}
                  style={{ flex: 1 }}
                />
                <Button
                  label={t('workout.skipRest')}
                  icon="skip"
                  variant="soft"
                  size="sm"
                  onPress={() => setRestEndsAt(null)}
                  style={{ flex: 1 }}
                  testID="rest-skip"
                />
              </Row>
            </View>
          ) : null}
          <Button
            label={t('workout.finish')}
            icon="check"
            variant="success"
            size="lg"
            disabled={setsDone === 0}
            loading={isSaving}
            onPress={finish}
            testID="workout-finish"
          />
        </>
      }
    >
      <Row gap={12}>
        <IconButton icon="close" label={t('workout.quit')} onPress={quit} testID="workout-quit" />
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={colors.textMuted}>
            {t('training.title')}
          </Txt>
          <Txt variant="heading" numberOfLines={1}>
            {dayTitle}
          </Txt>
        </View>
        <Row gap={6} style={styles.clockPill}>
          <Icon name="clock" size={16} color={colors.textMuted} />
          <Txt variant="label" tabular>
            {formatClock(elapsedSeconds)}
          </Txt>
        </Row>
      </Row>

      <View style={{ gap: 8 }}>
        <Row justify="space-between">
          <Txt variant="label" color={colors.textMuted}>
            {t('workout.setsProgress', { done: setsDone, total: setsTotal })}
          </Txt>
          <Txt variant="label" tabular color={colors.secondaryLight}>
            {Math.round((setsDone / setsTotal) * 100)}%
          </Txt>
        </Row>
        <ProgressBar progress={setsDone / setsTotal} color={colors.secondary} />
      </View>

      {day.items.map((item) => (
        <ExerciseCard
          key={item.exerciseId}
          item={item}
          progress={progressFor(item)}
          expanded={expandedId === item.exerciseId}
          onToggleInfo={() => setExpandedId(expandedId === item.exerciseId ? null : item.exerciseId)}
          onToggleSet={(setIndex) => toggleSet(item, setIndex)}
          onWeightChange={(weight) => setWeight(item, weight)}
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  cardDone: { borderColor: colors.secondary },
  howTo: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: spacing.md },
  setButton: {
    minWidth: 68,
    height: 58,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  setButtonDone: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  weightBox: {
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  weightInput: {
    width: 64,
    paddingVertical: 8,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  clockPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restBar: {
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.infoSoft,
  },
  summary: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  statTile: { flex: 1, gap: 4, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
});
