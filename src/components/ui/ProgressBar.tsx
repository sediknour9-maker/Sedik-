import React from 'react';
import { View } from 'react-native';

import { colors } from '../../theme/colors';
import { rowDirection, useRTL } from '../../theme/rtl';

interface ProgressBarProps {
  /** Fraction completed; values outside 0..1 are clamped. */
  progress: number;
  color: string;
  height?: number;
  trackColor?: string;
}

export function ProgressBar({ progress, color, height = 8, trackColor = colors.border }: ProgressBarProps) {
  const isRTL = useRTL();
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={{
        flexDirection: rowDirection(isRTL),
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}
