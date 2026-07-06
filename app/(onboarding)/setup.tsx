import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboardingDraft } from '../../src/store/OnboardingDraftContext';
import { colors } from '../../src/theme/colors';
import { useRTL, rowDirection, textAlign } from '../../src/theme/rtl';
import type { ActivityLevel, Sex } from '../../src/models/user';

const ACTIVITY_LEVELS: { value: ActivityLevel; labelKey: string }[] = [
  { value: 'sedentary', labelKey: 'onboarding.activitySedentary' },
  { value: 'light', labelKey: 'onboarding.activityLight' },
  { value: 'moderate', labelKey: 'onboarding.activityModerate' },
  { value: 'active', labelKey: 'onboarding.activityActive' },
  { value: 'veryActive', labelKey: 'onboarding.activityVeryActive' },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { draft, updateDraft } = useOnboardingDraft();
  const router = useRouter();
  const isRTL = useRTL();

  // Plausible human ranges; blocks zero/garbage input that would produce
  // nonsense (or negative) calorie targets downstream.
  const parseNumber = (value: string) => Number(value.replace(',', '.'));
  const age = parseNumber(draft.age);
  const heightCm = parseNumber(draft.heightCm);
  const weightKg = parseNumber(draft.weightKg);
  const canContinue =
    age >= 10 && age <= 100 && heightCm >= 100 && heightCm <= 250 && weightKg >= 25 && weightKg <= 300;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('onboarding.profileTitle')}</Text>

        <Text style={styles.label}>{t('onboarding.sexLabel')}</Text>
        <View style={[styles.segmentRow, { flexDirection: rowDirection(isRTL) }]}>
          {(['male', 'female'] as Sex[]).map((sex) => (
            <TouchableOpacity
              key={sex}
              style={[styles.segment, draft.sex === sex && styles.segmentActive]}
              onPress={() => updateDraft({ sex })}
            >
              <Text style={[styles.segmentText, draft.sex === sex && styles.segmentTextActive]}>
                {t(`onboarding.${sex}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('onboarding.ageLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign: textAlign(isRTL) }]}
          keyboardType="numeric"
          value={draft.age}
          onChangeText={(age) => updateDraft({ age })}
        />

        <Text style={styles.label}>{t('onboarding.heightLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign: textAlign(isRTL) }]}
          keyboardType="numeric"
          value={draft.heightCm}
          onChangeText={(heightCm) => updateDraft({ heightCm })}
        />

        <Text style={styles.label}>{t('onboarding.weightLabel')}</Text>
        <TextInput
          style={[styles.input, { textAlign: textAlign(isRTL) }]}
          keyboardType="numeric"
          value={draft.weightKg}
          onChangeText={(weightKg) => updateDraft({ weightKg })}
        />

        <Text style={styles.label}>{t('onboarding.activityLabel')}</Text>
        <View style={styles.activityList}>
          {ACTIVITY_LEVELS.map(({ value, labelKey }) => (
            <TouchableOpacity
              key={value}
              style={[styles.activityRow, draft.activityLevel === value && styles.activityRowActive]}
              onPress={() => updateDraft({ activityLevel: value })}
            >
              <Text
                style={[
                  styles.activityText,
                  { textAlign: textAlign(isRTL) },
                  draft.activityLevel === value && styles.activityTextActive,
                ]}
              >
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !canContinue && styles.nextButtonDisabled]}
          disabled={!canContinue}
          onPress={() => router.push('/(onboarding)/goals')}
        >
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  segmentRow: { gap: 8 },
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
  segmentText: { color: colors.text },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  activityList: { gap: 8 },
  activityRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  activityRowActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  activityText: { color: colors.text, fontSize: 13 },
  activityTextActive: { color: '#fff', fontWeight: '600' },
  nextButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 28 },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
