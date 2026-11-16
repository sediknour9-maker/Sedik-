import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, tones, type Tone } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { rowDirection, useRTL } from '../../theme/rtl';
import { Icon, type IconName } from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Fill color when selected. */
  tone?: Extract<Tone, 'primary' | 'secondary'>;
  testID?: string;
}

/** Pill for picking one or more options out of a short list. */
export function Chip({ label, selected, onPress, icon, tone = 'primary', testID }: ChipProps) {
  const isRTL = useRTL();
  const selectedColor = tone === 'primary' ? colors.primary : colors.secondary;
  const foreground = selected ? colors.onPrimary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        { flexDirection: rowDirection(isRTL) },
        selected && { backgroundColor: selectedColor, borderColor: selectedColor },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Icon name={icon} size={15} color={selected ? colors.onPrimary : tones.neutral.fg} /> : null}
      <Text style={[styles.label, { color: foreground }, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { fontSize: 13, fontWeight: '500' },
  labelSelected: { fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
