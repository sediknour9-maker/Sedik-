import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useProfile } from '../../src/store/ProfileContext';
import { useActivity } from '../../src/store/ActivityContext';
import { usePlan } from '../../src/store/PlanContext';
import { computeCardioKcal } from '../../src/services/cardioCalculator';
import { todayString } from '../../src/services/date';
import { CARDIO_ACTIVITIES, EXERCISES, MOBILITY_ROUTINE } from '../../src/data/exercises';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';
import type { EquipmentPreference } from '../../src/models/training';

type Segment = 'strength' | 'cardio' | 'mobility';

export default function TrainingScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { profile } = useProfile();
  const { todayActivities, logActivity } = useActivity();
  const { plan, regenerate } = usePlan();
  const [segment, setSegment] = useState<Segment>('strength');
  const [selectedCardio, setSelectedCardio] = useState(CARDIO_ACTIVITIES[0].id);
  const [durationMin, setDurationMin] = useState(30);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  if (!profile) return null;

  const cardioActivity = CARDIO_ACTIVITIES.find((a) => a.id === selectedCardio) ?? CARDIO_ACTIVITIES[0];
  const estKcal = computeCardioKcal(cardioActivity.met, profile.weightKg, durationMin);
  const mobilityDoneToday = todayActivities.some((a) => a.type === 'mobility');
  const equipment = plan?.equipment ?? 'gym';

  const logStrength = (dayId: string) =>
    logActivity({
      id: `${Date.now()}`,
      date: todayString(),
      type: 'strength',
      refId: dayId,
      loggedAt: new Date().toISOString(),
    });

  const logCardio = () =>
    logActivity({
      id: `${Date.now()}`,
      date: todayString(),
      type: 'cardio',
      refId: cardioActivity.id,
      durationMin,
      kcalBurned: estKcal,
      loggedAt: new Date().toISOString(),
    });

  const logMobility = () =>
    logActivity({
      id: `${Date.now()}`,
      date: todayString(),
      type: 'mobility',
      refId: 'routine',
      loggedAt: new Date().toISOString(),
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('training.title')}</Text>

        <View style={[styles.segmentRow, { flexDirection: rowDirection(isRTL) }]}>
          {(
            [
              { value: 'strength', labelKey: 'training.segStrength' },
              { value: 'cardio', labelKey: 'training.segCardio' },
              { value: 'mobility', labelKey: 'training.segMobility' },
            ] as { value: Segment; labelKey: string }[]
          ).map(({ value, labelKey }) => (
            <TouchableOpacity
              key={value}
              style={[styles.segment, segment === value && styles.segmentActive]}
              onPress={() => setSegment(value)}
            >
              <Text style={[styles.segmentText, segment === value && styles.segmentTextActive]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {segment === 'strength' ? (
          <>
            <View style={[styles.planHeader, { flexDirection: rowDirection(isRTL) }]}>
              <Text style={[styles.planTitle, { textAlign: textAlign(isRTL) }]}>{t('training.smartPlan')}</Text>
              <View style={[styles.equipRow, { flexDirection: rowDirection(isRTL) }]}>
                {(
                  [
                    { value: 'gym', labelKey: 'training.equipGym' },
                    { value: 'home', labelKey: 'training.equipHome' },
                  ] as { value: EquipmentPreference; labelKey: string }[]
                ).map(({ value, labelKey }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.equipChip, equipment === value && styles.equipChipActive]}
                    onPress={() => regenerate(value)}
                  >
                    <Text style={[styles.equipChipText, equipment === value && styles.equipChipTextActive]}>
                      {t(labelKey)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {plan?.days.map((day) => {
              const doneToday = todayActivities.some((a) => a.type === 'strength' && a.refId === day.id);
              return (
                <View key={day.id} style={styles.card}>
                  <Text style={[styles.cardTitle, { textAlign: textAlign(isRTL) }]}>
                    {t('training.day', { n: day.dayNumber })} · {t(day.focusKey)}
                  </Text>
                  {day.items.map((item) => {
                    const exercise = EXERCISES.find((e) => e.id === item.exerciseId);
                    if (!exercise) return null;
                    const isExpanded = expandedExercise === `${day.id}_${item.exerciseId}`;
                    return (
                      <View key={item.exerciseId}>
                        <TouchableOpacity
                          style={[styles.exerciseRow, { flexDirection: rowDirection(isRTL) }]}
                          onPress={() =>
                            setExpandedExercise(isExpanded ? null : `${day.id}_${item.exerciseId}`)
                          }
                        >
                          <Text style={[styles.exerciseName, { textAlign: textAlign(isRTL) }]}>
                            {t(exercise.nameKey)}
                          </Text>
                          <Text style={styles.exerciseDetail}>
                            {item.sets} × {item.reps}
                          </Text>
                        </TouchableOpacity>
                        {isExpanded ? (
                          <Text style={[styles.exerciseDesc, { textAlign: textAlign(isRTL) }]}>
                            {t(`exerciseDesc.${exercise.id}`)}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                  {doneToday ? (
                    <Text style={styles.doneText}>{t('training.workoutDone')}</Text>
                  ) : (
                    <TouchableOpacity style={styles.actionButton} onPress={() => logStrength(day.id)}>
                      <Text style={styles.actionButtonText}>{t('training.completeWorkout')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            <TouchableOpacity style={styles.regenerateButton} onPress={() => regenerate(equipment)}>
              <Text style={styles.regenerateButtonText}>↻ {t('training.regenerate')}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {segment === 'cardio' ? (
          <View style={styles.card}>
            <View style={[styles.chipWrap, { flexDirection: rowDirection(isRTL) }]}>
              {CARDIO_ACTIVITIES.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.chip, selectedCardio === activity.id && styles.chipActive]}
                  onPress={() => setSelectedCardio(activity.id)}
                >
                  <Text style={[styles.chipText, selectedCardio === activity.id && styles.chipTextActive]}>
                    {t(activity.nameKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { textAlign: textAlign(isRTL) }]}>{t('training.duration')}</Text>
            <View style={[styles.stepperRow, { flexDirection: rowDirection(isRTL) }]}>
              <TouchableOpacity
                style={styles.stepperButton}
                onPress={() => setDurationMin(Math.max(5, durationMin - 5))}
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>
                {durationMin} {t('common.minutes')}
              </Text>
              <TouchableOpacity style={styles.stepperButton} onPress={() => setDurationMin(durationMin + 5)}>
                <Text style={styles.stepperButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.estBurn}>{t('training.estBurn', { kcal: estKcal })}</Text>

            <TouchableOpacity style={styles.actionButton} onPress={logCardio}>
              <Text style={styles.actionButtonText}>{t('training.logCardio')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {segment === 'mobility' ? (
          <View style={styles.card}>
            {MOBILITY_ROUTINE.map((exercise) => (
              <View key={exercise.id} style={[styles.exerciseRow, { flexDirection: rowDirection(isRTL) }]}>
                <View style={styles.mobilityTextBlock}>
                  <Text style={[styles.exerciseName, { textAlign: textAlign(isRTL) }]}>{t(exercise.nameKey)}</Text>
                  <Text style={[styles.mobilityTarget, { textAlign: textAlign(isRTL) }]}>{t(exercise.targetKey)}</Text>
                </View>
                <Text style={styles.exerciseDetail}>{exercise.durationSec}s</Text>
              </View>
            ))}
            {mobilityDoneToday ? (
              <Text style={styles.doneText}>{t('training.routineDone')}</Text>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={logMobility}>
                <Text style={styles.actionButtonText}>{t('training.completeRoutine')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 14 },
  segmentRow: { gap: 8, marginBottom: 16 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
  planHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  equipRow: { gap: 6 },
  equipChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  equipChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  equipChipText: { color: colors.text, fontSize: 12 },
  equipChipTextActive: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  exerciseRow: { justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
  exerciseName: { fontSize: 14, color: colors.text, flex: 1 },
  exerciseDetail: { fontSize: 13, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  exerciseDesc: {
    fontSize: 12,
    color: colors.textMuted,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    lineHeight: 17,
  },
  mobilityTextBlock: { flex: 1 },
  mobilityTarget: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  doneText: { marginTop: 12, textAlign: 'center', color: colors.secondary, fontWeight: '700' },
  actionButton: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  regenerateButton: { alignItems: 'center', paddingVertical: 10 },
  regenerateButtonText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
  chipWrap: { flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 10, marginBottom: 8 },
  stepperRow: { alignItems: 'center', gap: 16, justifyContent: 'center' },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 18, color: colors.primary, fontWeight: '700' },
  stepperValue: { fontSize: 16, fontWeight: '700', color: colors.text, minWidth: 80, textAlign: 'center' },
  estBurn: { textAlign: 'center', marginTop: 10, color: colors.primaryDark, fontWeight: '600' },
});
