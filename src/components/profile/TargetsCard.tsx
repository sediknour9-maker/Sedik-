import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/colors';
import type { DailyTargets } from '../../models/user';
import { MacroTiles } from '../MacroTiles';
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
      <MacroTiles proteinG={targets.proteinG} carbsG={targets.carbsG} fatG={targets.fatG} />
    </Card>
  );
}
