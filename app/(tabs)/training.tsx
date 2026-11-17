import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { CARDIO_META, DEFAULT_CARDIO_META, MUSCLE_LABEL_KEYS } from '../../src/components/activityMeta';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Icon } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { IconButton } from '../../src/components/ui/IconButton';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Segmented } from '../../src/components/ui/Segmented';
import { Stepper } from '../../src/components/ui/Stepper';
import { useToast } from '../../src/components/ui/Toast';
import { Txt } from '../../src/components/ui/Txt';
import { CARDIO_ACTIVITIES, EXERCISES, MOBILITY_ROUTINE } from '../../src/data/exercises';
import { computeCardioKcal } from '../../src/services/cardioCalculator';
import { estimateDayMinutes } from '../../src/services/planGenerator';
import { formatClock } from '../../src/services/workoutTiming';
import { useActivity } from '../../src/store/ActivityContext';
import { usePlan } from '../../src/store/PlanContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useToday } from '../../src/store/useToday';
import { colors, tones } from '../../src/theme/colors';
import { radius, spacing } from '../../src/theme/tokens';
import type { EquipmentPreference, GeneratedDay } from '../../src/models/training';

type Segment = 'strength' | 'cardio' | 'mobility';

const SEGMENTS: Segment[] = ['strength', 'cardio', 'mobility'];
const GOAL_LABEL_KEYS = { lose: 'onboarding.goalLose', maintain: 'onboarding.goalMaintain', gain: 'onboarding.goalGain' };
const MOBILITY_MINUTES = Math.round(MOBILITY_ROUTINE.reduce((sum, item) => sum + item.durationSec, 0) / 60);
const CARDIO_STEP_MIN = 5;

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}

interface PlanDayCardProps {
  day: GeneratedDay;
  status: 'done' | 'next' | null;
  expandedExercise: string | null;
  onToggleExercise: (key: string) => void;
  onStart: () => void;
}

function PlanDayCard({ day, status, expandedExercise, onToggleExercise, onStart }: PlanDayCardProps) {
  const { t } = useTranslation();

  return (
    <Card style={[{ gap: 12 }, status === 'next' && styles.cardHighlighted]} testID={`plan-${day.id}`}>
      <Row gap={12}>
        <View style={[styles.dayBadge, status === 'done' && { backgroundColor: colors.secondarySoft }]}>
          {status === 'done' ? (
            <Icon name="check" size={20} color={colors.secondaryLight} strokeWidth={3} />
          ) : (
            <Txt variant="heading" center color={colors.primaryLight}>
              {day.dayNumber}
            </Txt>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">
            {t('training.day', { n: day.dayNumber })} · {t(day.focusKey)}
          </Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t('home.exerciseCount', { count: day.items.length })} ·{' '}
            {t('home.durationApprox', { minutes: estimateDayMinutes(day) })}
          </Txt>
        </View>
        {status ? (
          <View style={[styles.statusPill, { backgroundColor: status === 'done' ? tones.secondary.bg : tones.primary.bg }]}>
            <Txt variant="micro" color={status === 'done' ? tones.secondary.fg : tones.primary.fg}>
              {t(status === 'done' ? 'training.doneToday' : 'training.nextUp')}
            </Txt>
          </View>
        ) : null}
      </Row>

      <View>
        {day.items.map((item) => {
          const exercise = EXERCISES.find((candidate) => candidate.id === item.exerciseId);
          if (!exercise) return null;
          const key = `${day.id}_${exercise.id}`;
          const isExpanded = expandedExercise === key;
          return (
            <Pressable
              key={exercise.id}
              onPress={() => onToggleExercise(key)}
              accessibilityRole="button"
              accessibilityState={{ expanded: isExpanded }}
              style={({ pressed }) => [styles.exerciseRow, pressed && { opacity: 0.7 }]}
            >
              <Row gap={10}>
                <View style={{ flex: 1 }}>
                  <Txt variant="body">{t(exercise.nameKey)}</Txt>
                  <Txt variant="micro" color={colors.textDim}>
                    {t(MUSCLE_LABEL_KEYS[exercise.muscleGroup])}
                  </Txt>
                </View>
                <Txt variant="label" tabular color={colors.textMuted}>
                  {item.sets} × {item.reps}
                </Txt>
                <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={16} color={colors.textDim} />
              </Row>
              {isExpanded ? (
                <Txt variant="caption" color={colors.textMuted} style={styles.exerciseDesc}>
                  {t(`exerciseDesc.${exercise.id}`)}
                </Txt>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Button
        label={t('home.startWorkout')}
        icon="play"
        variant={status === 'next' ? 'primary' : 'secondary'}
        onPress={onStart}
        testID={`start-${day.id}`}
      />
    </Card>
  );
}

export default function TrainingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const today = useToday();
  const showToast = useToast();
  const params = useLocalSearchParams<{ segment?: string }>();
  const { profile } = useProfile();
  const { todayActivities, activityCounts, logActivity, removeActivityEntry } = useActivity();
  const { plan, regenerate } = usePlan();

  const [segment, setSegment] = useState<Segment>('strength');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [selectedCardio, setSelectedCardio] = useState(CARDIO_ACTIVITIES[0].id);
  const [durationMin, setDurationMin] = useState(30);

  // Other screens can open a specific section, e.g. the mobility goal on Home.
  useEffect(() => {
    if (params.segment && (SEGMENTS as string[]).includes(params.segment)) {
      setSegment(params.segment as Segment);
    }
  }, [params.segment]);

  if (!profile) return null;

  const cardioActivity = CARDIO_ACTIVITIES.find((activity) => activity.id === selectedCardio) ?? CARDIO_ACTIVITIES[0];
  const estimatedKcal = computeCardioKcal(cardioActivity.met, profile.weightKg, durationMin);
  const todayCardio = todayActivities.filter((activity) => activity.type === 'cardio');
  const mobilityDone = todayActivities.some((activity) => activity.type === 'mobility');
  const doneDayIds = new Set(todayActivities.filter((a) => a.type === 'strength').map((a) => a.refId));
  const nextDayId = plan?.days.length ? plan.days[activityCounts.strength % plan.days.length].id : null;

  const changeEquipment = async (equipment: EquipmentPreference) => {
    if (equipment === plan?.equipment) return;
    await regenerate(equipment);
    showToast(t('training.planRegenerated'));
  };

  const saveCardio = async () => {
    await logActivity({
      id: `${Date.now()}`,
      date: today,
      type: 'cardio',
      refId: cardioActivity.id,
      durationMin,
      kcalBurned: estimatedKcal,
      loggedAt: new Date().toISOString(),
    });
    showToast(t('training.cardioSaved'));
  };

  return (
    <Screen>
      <ScreenHeader
        title={t('training.title')}
        subtitle={
          plan ? `${t('training.perWeek', { count: plan.days.length })} · ${t(GOAL_LABEL_KEYS[profile.goal])}` : undefined
        }
      />

      <Segmented
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'strength', label: t('training.segStrength'), icon: 'dumbbell' },
          { value: 'cardio', label: t('training.segCardio'), icon: 'heartPulse' },
          { value: 'mobility', label: t('training.segMobility'), icon: 'person' },
        ]}
      />

      {segment === 'strength' && plan ? (
        <>
          <Card style={{ gap: 12 }}>
            <Row gap={12}>
              <IconBadge icon="sparkles" tone="accent" size={40} />
              <View style={{ flex: 1 }}>
                <Txt variant="heading">{t('training.smartPlan')}</Txt>
                <Txt variant="caption" color={colors.textMuted}>
                  {t('training.smartPlanHint')}
                </Txt>
              </View>
            </Row>
            <Segmented
              value={plan.equipment}
              onChange={changeEquipment}
              options={[
                { value: 'gym', label: t('training.equipGym'), icon: 'dumbbell' },
                { value: 'home', label: t('training.equipHome'), icon: 'home' },
              ]}
            />
          </Card>

          {plan.days.map((day) => (
            <PlanDayCard
              key={day.id}
              day={day}
              status={doneDayIds.has(day.id) ? 'done' : day.id === nextDayId ? 'next' : null}
              expandedExercise={expandedExercise}
              onToggleExercise={(key) => setExpandedExercise(expandedExercise === key ? null : key)}
              onStart={() => router.push({ pathname: '/workout/[dayId]', params: { dayId: day.id } })}
            />
          ))}
        </>
      ) : null}

      {segment === 'cardio' ? (
        <>
          <Card style={{ gap: 10 }}>
            <Txt variant="heading">{t('training.chooseActivity')}</Txt>
            {chunk(CARDIO_ACTIVITIES, 3).map((row) => (
              <Row key={row[0].id} gap={10} align="stretch">
                {row.map((activity) => {
                  const meta = CARDIO_META[activity.id] ?? DEFAULT_CARDIO_META;
                  const isSelected = activity.id === selectedCardio;
                  return (
                    <Pressable
                      key={activity.id}
                      onPress={() => setSelectedCardio(activity.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      testID={`cardio-${activity.id}`}
                      style={({ pressed }) => [
                        styles.cardioTile,
                        isSelected && styles.cardioTileSelected,
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <IconBadge icon={meta.icon} tone={meta.tone} size={38} />
                      <Txt variant="caption" center numberOfLines={2}>
                        {t(activity.nameKey)}
                      </Txt>
                    </Pressable>
                  );
                })}
              </Row>
            ))}
          </Card>

          <Card style={{ gap: 16 }}>
            <Txt variant="heading">{t('workout.duration')}</Txt>
            <Stepper
              value={`${durationMin} ${t('units.min')}`}
              canDecrement={durationMin > CARDIO_STEP_MIN}
              onDecrement={() => setDurationMin(Math.max(CARDIO_STEP_MIN, durationMin - CARDIO_STEP_MIN))}
              onIncrement={() => setDurationMin(durationMin + CARDIO_STEP_MIN)}
            />
            <Row gap={8} justify="center" style={styles.burnRow}>
              <Icon name="flame" size={18} color={colors.orange} fill={colors.orange} />
              <Txt variant="subheading" tabular>
                {t('training.estBurn', { kcal: estimatedKcal })}
              </Txt>
            </Row>
            <Button label={t('training.logCardio')} icon="plus" onPress={saveCardio} testID="cardio-save" />
          </Card>

          {todayCardio.length ? (
            <Card style={{ gap: 4 }}>
              <Txt variant="heading" style={{ marginBottom: 4 }}>
                {t('common.today')}
              </Txt>
              {todayCardio.map((entry) => {
                const activity = CARDIO_ACTIVITIES.find((candidate) => candidate.id === entry.refId);
                const meta = CARDIO_META[entry.refId] ?? DEFAULT_CARDIO_META;
                return (
                  <Row key={entry.id} gap={12} style={styles.logRow}>
                    <IconBadge icon={meta.icon} tone={meta.tone} size={34} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="subheading">{activity ? t(activity.nameKey) : entry.refId}</Txt>
                      <Txt variant="caption" color={colors.textMuted}>
                        {entry.durationMin} {t('units.min')} · {entry.kcalBurned} {t('common.kcal')}
                      </Txt>
                    </View>
                    <IconButton
                      icon="trash"
                      label={t('common.delete')}
                      size={34}
                      color={colors.danger}
                      filled={false}
                      onPress={() => removeActivityEntry(entry)}
                      testID={`cardio-delete-${entry.id}`}
                    />
                  </Row>
                );
              })}
            </Card>
          ) : null}
        </>
      ) : null}

      {segment === 'mobility' ? (
        <Card style={{ gap: 14 }}>
          <Row gap={12}>
            <IconBadge icon="person" tone="violet" size={44} />
            <View style={{ flex: 1 }}>
              <Txt variant="heading">{t('training.mobilityTitle')}</Txt>
              <Txt variant="caption" color={colors.textMuted}>
                {t('home.exerciseCount', { count: MOBILITY_ROUTINE.length })} ·{' '}
                {t('home.durationApprox', { minutes: MOBILITY_MINUTES })}
              </Txt>
            </View>
          </Row>

          <View>
            {MOBILITY_ROUTINE.map((item, index) => (
              <Row key={item.id} gap={12} style={styles.mobilityRow}>
                <View style={styles.indexBubble}>
                  <Txt variant="micro" center color={colors.textMuted}>
                    {index + 1}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="body">{t(item.nameKey)}</Txt>
                  <Txt variant="micro" color={colors.textDim}>
                    {t(item.targetKey)}
                  </Txt>
                </View>
                <Txt variant="label" tabular color={colors.textMuted}>
                  {formatClock(item.durationSec)}
                </Txt>
              </Row>
            ))}
          </View>

          {mobilityDone ? (
            <Row gap={8} style={styles.doneBanner}>
              <Icon name="checkCircle" size={20} color={colors.secondaryLight} />
              <Txt variant="label" color={colors.secondaryLight}>
                {t('training.routineDone')}
              </Txt>
            </Row>
          ) : null}
          <Button
            label={mobilityDone ? t('training.routineAgain') : t('training.startRoutine')}
            icon="play"
            variant={mobilityDone ? 'secondary' : 'primary'}
            onPress={() => router.push('/mobility')}
            testID="mobility-start"
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHighlighted: { borderColor: colors.primary },
  dayBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill },
  exerciseRow: {
    paddingVertical: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  exerciseDesc: {
    marginTop: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
  },
  cardioTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  cardioTileSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  burnRow: { paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.orangeSoft },
  logRow: { paddingVertical: 8 },
  mobilityRow: { paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  indexBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBanner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.secondarySoft,
  },
});
