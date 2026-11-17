import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/colors';
import { Row } from './Row';
import { Txt } from './Txt';

interface StepIndicatorProps {
  current: number;
  total: number;
}

/** "Step 2 of 3" with one bar per step, filled up to the current one. */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 8 }}>
      <Row gap={6}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: index < current ? colors.primary : colors.border,
            }}
          />
        ))}
      </Row>
      <Txt variant="micro" color={colors.textMuted}>
        {t('onboarding.step', { current, total })}
      </Txt>
    </View>
  );
}
