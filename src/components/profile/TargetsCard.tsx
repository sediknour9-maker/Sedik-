import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, macroColors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import type { DailyTargets } from '../../models/user';
import { Card } from '../ui/Card';
import { Row } from '../ui/Row';
import { Txt } from '../ui/Txt';

interface TargetsCardProps {
  targets: DailyTargets;
  title: string;
}

/** Daily calorie target in large type with the protein / carbs / fat split underneath. */
export function TargetsCard({ targets, title }: TargetsCardProps) {
  const { t } = useTranslation();

  const macros = [
    { key: 'protein', label: t('common.protein'), grams: targets.proteinG, color: macroColors.protein },
    { key: 'carbs', label: t('common.carbs'), grams: targets.carbsG, color: macroColors.carbs },
    { key: 'fat', label: t('common.fat'), grams: targets.fatG, color: macroColors.fat },
  ];

  return (
    <Card style={{ gap: 16 }}>
      <View style={{ gap: 2 }}>
        <Txt variant="label" color={colors.textMuted}>
          {title}
        </Txt>
        <Row gap={6} align="flex-end">
          <Txt variant="display" tabular color={colors.primaryLight}>
            {targets.kcal}
          </Txt>
          <Txt variant="subheading" color={colors.textMuted} style={{ marginBottom: 5 }}>
            {t('common.kcal')} / {t('common.perDay')}
          </Txt>
        </Row>
      </View>
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
              {macro.grams} g
            </Txt>
            <Txt variant="micro" color={colors.textMuted} numberOfLines={1}>
              {macro.label}
            </Txt>
          </View>
        ))}
      </Row>
    </Card>
  );
}
