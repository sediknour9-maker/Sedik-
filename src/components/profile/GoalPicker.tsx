import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Tone } from '../../theme/colors';
import type { Goal } from '../../models/user';
import type { IconName } from '../ui/Icon';
import { OptionCard } from '../ui/OptionCard';

const GOAL_OPTIONS: { value: Goal; icon: IconName; tone: Tone; titleKey: string; descKey: string }[] = [
  { value: 'lose', icon: 'trendingDown', tone: 'info', titleKey: 'onboarding.goalLose', descKey: 'onboarding.goalLoseDesc' },
  {
    value: 'maintain',
    icon: 'target',
    tone: 'secondary',
    titleKey: 'onboarding.goalMaintain',
    descKey: 'onboarding.goalMaintainDesc',
  },
  { value: 'gain', icon: 'trendingUp', tone: 'orange', titleKey: 'onboarding.goalGain', descKey: 'onboarding.goalGainDesc' },
];

interface GoalPickerProps {
  value: Goal;
  onChange: (goal: Goal) => void;
}

export function GoalPicker({ value, onChange }: GoalPickerProps) {
  const { t } = useTranslation();

  return (
    <View style={{ gap: 10 }}>
      {GOAL_OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          icon={option.icon}
          tone={option.tone}
          title={t(option.titleKey)}
          description={t(option.descKey)}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
          testID={`goal-${option.value}`}
        />
      ))}
    </View>
  );
}
