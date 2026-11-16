import React from 'react';
import { View } from 'react-native';

import { tones, type Tone } from '../../theme/colors';
import { Icon, type IconName } from './Icon';

interface IconBadgeProps {
  icon: IconName;
  tone?: Tone;
  size?: number;
}

/** Icon on a softly tinted rounded tile; the tone color-codes what it stands for. */
export function IconBadge({ icon, tone = 'primary', size = 40 }: IconBadgeProps) {
  const { fg, bg } = tones[tone];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size * 0.5} color={fg} />
    </View>
  );
}
