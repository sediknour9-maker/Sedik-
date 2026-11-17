import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, type Tone } from '../theme/colors';
import { IconBadge } from './ui/IconBadge';
import type { IconName } from './ui/Icon';
import { ProgressRing } from './ui/ProgressRing';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface StatLineProps {
  icon: IconName;
  tone: Tone;
  label: string;
  value: number;
}

function StatLine({ icon, tone, label, value }: StatLineProps) {
  return (
    <Row gap={10}>
      <IconBadge icon={icon} tone={tone} size={30} />
      <Txt variant="caption" color={colors.textMuted} style={{ flex: 1 }} numberOfLines={1}>
        {label}
      </Txt>
      <Txt variant="subheading" tabular>
        {Math.round(value)}
      </Txt>
    </Row>
  );
}

interface CalorieSummaryProps {
  consumedKcal: number;
  goalKcal: number;
  /** Calories burned through logged activity; the line is omitted when undefined. */
  burnedKcal?: number;
}

/** Ring with the calories still available today, next to eaten / burned / goal figures. */
export function CalorieSummary({ consumedKcal, goalKcal, burnedKcal }: CalorieSummaryProps) {
  const { t } = useTranslation();
  const remaining = Math.round(goalKcal - consumedKcal);
  const isOver = remaining < 0;

  return (
    <Row gap={18}>
      <ProgressRing
        size={132}
        strokeWidth={12}
        progress={goalKcal > 0 ? consumedKcal / goalKcal : 0}
        color={isOver ? colors.danger : colors.primary}
        gradientTo={isOver ? undefined : colors.orange}
      >
        <Txt variant="display" center tabular style={{ fontSize: 30, lineHeight: 34 }}>
          {Math.abs(remaining)}
        </Txt>
        <Txt variant="micro" center color={isOver ? colors.danger : colors.textMuted}>
          {t(isOver ? 'home.kcalOver' : 'home.kcalLeft')}
        </Txt>
      </ProgressRing>

      <View style={{ flex: 1, gap: 10 }}>
        <StatLine icon="utensils" tone="primary" label={t('home.eaten')} value={consumedKcal} />
        {burnedKcal !== undefined ? (
          <StatLine icon="flame" tone="orange" label={t('home.burned')} value={burnedKcal} />
        ) : null}
        <StatLine icon="target" tone="neutral" label={t('home.goal')} value={goalKcal} />
      </View>
    </Row>
  );
}
