import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/tokens';
import { IconBadge } from './ui/IconBadge';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

/** Shown while Ramadan mode is active, explaining why the meal slots changed. */
export function RamadanBanner() {
  const { t } = useTranslation();

  return (
    <Row gap={12} style={styles.banner}>
      <IconBadge icon="moonStar" tone="accent" size={38} />
      <View style={{ flex: 1 }}>
        <Txt variant="subheading">{t('ramadan.bannerActive')}</Txt>
        <Txt variant="caption" color={colors.textMuted}>
          {t('ramadan.bannerHint')}
        </Txt>
      </View>
    </Row>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
