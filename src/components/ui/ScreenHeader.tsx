import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/colors';
import { useRTL } from '../../theme/rtl';
import { IconButton } from './IconButton';
import { Row } from './Row';
import { Txt } from './Txt';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back arrow and switches to the compact title used on pushed screens. */
  onBack?: () => void;
  right?: ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  return (
    <Row gap={12}>
      {onBack ? (
        <IconButton
          icon={isRTL ? 'arrowRight' : 'arrowLeft'}
          label={t('common.back')}
          onPress={onBack}
          testID="header-back"
        />
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt variant={onBack ? 'heading' : 'title'} numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt variant="caption" color={colors.textMuted}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </Row>
  );
}
