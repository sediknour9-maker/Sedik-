import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingDraft } from '../../src/store/OnboardingDraftContext';
import { useProfile } from '../../src/store/ProfileContext';
import { computeTargets } from '../../src/services/calorieCalculator';
import { colors } from '../../src/theme/colors';
import { useRTL, rowDirection, textAlign } from '../../src/theme/rtl';
import type { Goal } from '../../src/models/user';

const GOALS: { value: Goal; labelKey: string }[] = [
  { value: 'lose', labelKey: 'onboarding.goalLose' },
  { value: 'maintain', labelKey: 'onboarding.goalMaintain' },
  { value: 'gain', labelKey: 'onboarding.goalGain' },
];

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { draft, updateDraft } = useOnboardingDraft();
  const { createProfile } = useProfile();
  const router = useRouter();
  const isRTL = useRTL();

  const parsedDraft = useMemo(
    () => ({
      sex: draft.sex,
      age: Number(draft.age) || 0,
      heightCm: Number(draft.heightCm) || 0,
      weightKg: Number(draft.weightKg) || 0,
      activityLevel: draft.activityLevel,
      goal: draft.goal,
    }),
    [draft]
  );

  const targets = useMemo(() => computeTargets(parsedDraft), [parsedDraft]);

  const handleFinish = async () => {
    await createProfile(parsedDraft);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('onboarding.goalsTitle')}</Text>

        <View style={styles.goalList}>
          {GOALS.map(({ value, labelKey }) => (
            <TouchableOpacity
              key={value}
              style={[styles.goalRow, draft.goal === value && styles.goalRowActive]}
              onPress={() => updateDraft({ goal: value })}
            >
              <Text style={[styles.goalText, draft.goal === value && styles.goalTextActive]}>{t(labelKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.reviewTitle, { textAlign: textAlign(isRTL) }]}>{t('onboarding.reviewTitle')}</Text>
        <Text style={[styles.reviewSubtitle, { textAlign: textAlign(isRTL) }]}>
          {t('onboarding.dailyTargetSummary')}
        </Text>

        <View style={styles.targetCard}>
          <Text style={styles.targetKcal}>
            {targets.kcal} {t('common.kcal')} / {t('common.perDay')}
          </Text>
          <View style={[styles.macroRow, { flexDirection: rowDirection(isRTL) }]}>
            <Text style={styles.macroText}>
              {t('common.protein')}: {targets.proteinG}g
            </Text>
            <Text style={styles.macroText}>
              {t('common.carbs')}: {targets.carbsG}g
            </Text>
            <Text style={styles.macroText}>
              {t('common.fat')}: {targets.fatG}g
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Text style={styles.finishButtonText}>{t('onboarding.finish')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 },
  goalList: { gap: 8, marginBottom: 28 },
  goalRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  goalRowActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  goalText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  goalTextActive: { color: '#fff' },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  reviewSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  targetCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  targetKcal: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 10, textAlign: 'center' },
  macroRow: { justifyContent: 'space-around' },
  macroText: { fontSize: 13, color: colors.textMuted },
  finishButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
