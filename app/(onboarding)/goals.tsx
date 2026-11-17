import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { GoalPicker } from '../../src/components/profile/GoalPicker';
import { TargetsCard } from '../../src/components/profile/TargetsCard';
import { Button } from '../../src/components/ui/Button';
import { IconButton } from '../../src/components/ui/IconButton';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { StepIndicator } from '../../src/components/ui/StepIndicator';
import { Txt } from '../../src/components/ui/Txt';
import { computeTargets } from '../../src/services/calorieCalculator';
import { parseDecimal } from '../../src/services/profileValidation';
import { useOnboardingDraft } from '../../src/store/OnboardingDraftContext';
import { useProfile } from '../../src/store/ProfileContext';
import { colors } from '../../src/theme/colors';
import { useRTL } from '../../src/theme/rtl';

export default function GoalsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { draft, updateDraft } = useOnboardingDraft();
  const { createProfile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);

  const profileDraft = useMemo(
    () => ({
      sex: draft.sex,
      age: parseDecimal(draft.age),
      heightCm: parseDecimal(draft.heightCm),
      weightKg: parseDecimal(draft.weightKg),
      activityLevel: draft.activityLevel,
      goal: draft.goal,
    }),
    [draft]
  );

  const targets = useMemo(() => computeTargets(profileDraft), [profileDraft]);

  const handleFinish = async () => {
    setIsSaving(true);
    await createProfile(profileDraft);
    router.replace('/(tabs)');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          label={t('onboarding.finish')}
          icon="sparkles"
          size="lg"
          loading={isSaving}
          onPress={handleFinish}
          testID="onboarding-finish"
        />
      }
    >
      <Row gap={14}>
        <IconButton icon={isRTL ? 'arrowRight' : 'arrowLeft'} label={t('common.back')} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <StepIndicator current={3} total={3} />
        </View>
      </Row>

      <View style={{ gap: 4 }}>
        <Txt variant="title">{t('onboarding.goalsTitle')}</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {t('onboarding.goalsSubtitle')}
        </Txt>
      </View>

      <GoalPicker value={draft.goal} onChange={(goal) => updateDraft({ goal })} />

      <TargetsCard targets={targets} title={t('onboarding.reviewTitle')} />
    </Screen>
  );
}
