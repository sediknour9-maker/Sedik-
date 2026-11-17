import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { BodyStatsForm, isBodyStatsComplete } from '../../src/components/profile/BodyStatsForm';
import { Button } from '../../src/components/ui/Button';
import { IconButton } from '../../src/components/ui/IconButton';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { StepIndicator } from '../../src/components/ui/StepIndicator';
import { Txt } from '../../src/components/ui/Txt';
import { useOnboardingDraft } from '../../src/store/OnboardingDraftContext';
import { colors } from '../../src/theme/colors';
import { useRTL } from '../../src/theme/rtl';

export default function SetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { draft, updateDraft } = useOnboardingDraft();

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          label={t('common.next')}
          size="lg"
          disabled={!isBodyStatsComplete(draft)}
          onPress={() => router.push('/(onboarding)/goals')}
          testID="onboarding-next"
        />
      }
    >
      <Row gap={14}>
        <IconButton icon={isRTL ? 'arrowRight' : 'arrowLeft'} label={t('common.back')} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <StepIndicator current={2} total={3} />
        </View>
      </Row>

      <View style={{ gap: 4 }}>
        <Txt variant="title">{t('onboarding.profileTitle')}</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {t('onboarding.setupSubtitle')}
        </Txt>
      </View>

      <BodyStatsForm values={draft} onChange={updateDraft} />
    </Screen>
  );
}
