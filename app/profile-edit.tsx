import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Redirect, useRouter } from 'expo-router';

import { BodyStatsForm, isBodyStatsComplete, type BodyStatsValues } from '../src/components/profile/BodyStatsForm';
import { GoalPicker } from '../src/components/profile/GoalPicker';
import { TargetsCard } from '../src/components/profile/TargetsCard';
import { Button } from '../src/components/ui/Button';
import { Screen } from '../src/components/ui/Screen';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { useToast } from '../src/components/ui/Toast';
import { Txt } from '../src/components/ui/Txt';
import { computeTargets } from '../src/services/calorieCalculator';
import { parseDecimal } from '../src/services/profileValidation';
import { useActivity } from '../src/store/ActivityContext';
import { useProfile } from '../src/store/ProfileContext';
import type { Goal } from '../src/models/user';

export default function ProfileEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useToast();
  const { profile, updateProfile } = useProfile();
  const { logWeight } = useActivity();
  const [values, setValues] = useState<BodyStatsValues | null>(() =>
    profile
      ? {
          sex: profile.sex,
          age: String(profile.age),
          heightCm: String(profile.heightCm),
          weightKg: String(profile.weightKg),
          activityLevel: profile.activityLevel,
        }
      : null
  );
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintain');
  const [isSaving, setIsSaving] = useState(false);

  const complete = values ? isBodyStatsComplete(values) : false;
  const draft = useMemo(
    () =>
      values && complete
        ? {
            sex: values.sex,
            age: Math.round(parseDecimal(values.age)),
            heightCm: Math.round(parseDecimal(values.heightCm)),
            weightKg: Math.round(parseDecimal(values.weightKg) * 10) / 10,
            activityLevel: values.activityLevel,
            goal,
          }
        : null,
    [values, complete, goal]
  );
  const targets = useMemo(() => (draft ? computeTargets(draft) : null), [draft]);

  if (!profile || !values) return <Redirect href="/(tabs)/profile" />;

  const save = async () => {
    if (!draft) return;
    setIsSaving(true);
    await updateProfile(draft);
    // A new weight also lands in the weight log, so the progress chart and the profile agree.
    if (draft.weightKg !== profile.weightKg) await logWeight(draft.weightKg);
    showToast(t('profile.updated'));
    router.back();
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          label={t('profile.saveChanges')}
          icon="check"
          size="lg"
          disabled={!draft}
          loading={isSaving}
          onPress={save}
          testID="profile-save"
        />
      }
    >
      <ScreenHeader title={t('profile.editTitle')} subtitle={t('profile.editSubtitle')} onBack={() => router.back()} />

      <BodyStatsForm values={values} onChange={(patch) => setValues({ ...values, ...patch })} />

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('profile.goal')}</Txt>
        <GoalPicker value={goal} onChange={setGoal} />
      </View>

      {targets ? <TargetsCard targets={targets} title={t('profile.newTargets')} /> : null}
    </Screen>
  );
}
