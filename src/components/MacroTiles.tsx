import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '../i18n/locale';
import { colors, macroColors } from '../theme/colors';
import { radius } from '../theme/tokens';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface MacroTilesProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** Protein, carbs and fat in grams, each on a tile topped with its macro color. */
export function MacroTiles({ proteinG, carbsG, fatG }: MacroTilesProps) {
  const { t, i18n } = useTranslation();

  const macros = [
    { key: 'protein', label: t('common.protein'), grams: proteinG, color: macroColors.protein },
    { key: 'carbs', label: t('common.carbs'), grams: carbsG, color: macroColors.carbs },
    { key: 'fat', label: t('common.fat'), grams: fatG, color: macroColors.fat },
  ];

  return (
    <Row gap={10}>
      {macros.map((macro) => (
        <View
          key={macro.key}
          style={{
            flex: 1,
            gap: 4,
            padding: 10,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceRaised,
            borderTopWidth: 3,
            borderTopColor: macro.color,
          }}
        >
          <Txt variant="heading" tabular>
            {formatNumber(macro.grams, i18n.language)} {t('units.g')}
          </Txt>
          <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
            {macro.label}
          </Txt>
        </View>
      ))}
    </Row>
  );
}
