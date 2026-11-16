import React, { useId, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { colors } from '../../theme/colors';

interface ProgressRingProps {
  size: number;
  strokeWidth: number;
  /** Fraction completed; values outside 0..1 are clamped. */
  progress: number;
  color: string;
  /** Second color to blend the arc toward. */
  gradientTo?: string;
  trackColor?: string;
  children?: ReactNode;
}

export function ProgressRing({
  size,
  strokeWidth,
  progress,
  color,
  gradientTo,
  trackColor = colors.border,
  children,
}: ProgressRingProps) {
  const gradientId = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const center = size / 2;
  const ringRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.rotated}>
        {gradientTo ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={color} />
              <Stop offset="1" stopColor={gradientTo} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle cx={center} cy={center} r={ringRadius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            stroke={gradientTo ? `url(#${gradientId})` : color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
      {children ? <View style={[StyleSheet.absoluteFill, styles.center]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // SVG arcs start at 3 o'clock; rotating puts the start at the top.
  rotated: { transform: [{ rotate: '-90deg' }] },
  center: { alignItems: 'center', justifyContent: 'center' },
});
