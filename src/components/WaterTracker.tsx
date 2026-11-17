import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { WATER_GOAL_GLASSES } from '../services/waterRepository';
import { useWater } from '../store/WaterContext';
import { colors } from '../theme/colors';
import { Card } from './ui/Card';
import { Icon } from './ui/Icon';
import { IconBadge } from './ui/IconBadge';
import { IconButton } from './ui/IconButton';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface WaterTrackerProps {
  date: string;
}

/** One droplet per glass of water; tapping a droplet sets the day's count up to it. */
export function WaterTracker({ date }: WaterTrackerProps) {
  const { t } = useTranslation();
  const { glasses, setGlasses } = useWater(date);

  return (
    <Card style={{ gap: 14 }}>
      <Row gap={10}>
        <IconBadge icon="glass" tone="info" size={34} />
        <Txt variant="heading" style={{ flex: 1 }}>
          {t('water.title')}
        </Txt>
        <Txt variant="label" color={colors.textMuted} tabular>
          {t('water.progress', { count: glasses, goal: WATER_GOAL_GLASSES })}
        </Txt>
      </Row>

      <Row justify="space-between">
        {Array.from({ length: WATER_GOAL_GLASSES }, (_, index) => {
          const isFilled = index < glasses;
          return (
            <Pressable
              key={index}
              // Tapping the last filled droplet empties it again.
              onPress={() => setGlasses(glasses === index + 1 ? index : index + 1)}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={t('water.glassNumber', { number: index + 1 })}
              accessibilityState={{ selected: isFilled }}
              testID={`water-glass-${index + 1}`}
            >
              <Icon
                name="droplet"
                size={26}
                color={isFilled ? colors.info : colors.border}
                fill={isFilled ? colors.info : 'none'}
              />
            </Pressable>
          );
        })}
        <IconButton
          icon="plus"
          label={t('water.addGlass')}
          size={32}
          color={colors.info}
          onPress={() => setGlasses(glasses + 1)}
        />
      </Row>
    </Card>
  );
}
