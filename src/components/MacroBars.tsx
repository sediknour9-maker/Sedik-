import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, macroColors } from '../theme/colors';
import { ProgressBar } from './ui/ProgressBar';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface MacroValues {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface MacroBarsProps {
  consumed: MacroValues;
  targets: MacroValues;
}

/** Protein, carbs and fat side by side, each as grams eaten against the daily target. */
export function MacroBars({ consumed, targets }: MacroBarsProps) {
  const { t } = useTranslation();

  const macros = [
    { key: 'protein', label: t('common.protein'), value: consumed.proteinG, target: targets.proteinG, color: macroColors.protein },
    { key: 'carbs', label: t('common.carbs'), value: consumed.carbsG, target: targets.carbsG, color: macroColors.carbs },
    { key: 'fat', label: t('common.fat'), value: consumed.fatG, target: targets.fatG, color: macroColors.fat },
  ];

  return (
    <Row gap={14} align="flex-start">
      {macros.map((macro) => (
        <View key={macro.key} style={{ flex: 1, gap: 6 }}>
          <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
            {macro.label}
          </Txt>
          <ProgressBar progress={macro.target > 0 ? macro.value / macro.target : 0} color={macro.color} height={6} />
          <Txt variant="caption" tabular numberOfLines={1}>
            {Math.round(macro.value)} / {Math.round(macro.target)} {t('units.g')}
          </Txt>
        </View>
      ))}
    </Row>
  );
}
