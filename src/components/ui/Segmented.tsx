import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { rowDirection, useRTL } from '../../theme/rtl';
import { Icon, type IconName } from './Icon';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Equal-width switch between a few mutually exclusive views or options. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const isRTL = useRTL();

  return (
    <View style={[styles.track, { flexDirection: rowDirection(isRTL) }]}>
      {options.map((option) => {
        const selected = option.value === value;
        const foreground = selected ? colors.onPrimary : colors.textMuted;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, { flexDirection: rowDirection(isRTL) }, selected && styles.segmentSelected]}
          >
            {option.icon ? <Icon name={option.icon} size={16} color={foreground} /> : null}
            <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
  },
  segmentSelected: { backgroundColor: colors.primary },
  label: { fontSize: 13, fontWeight: '700' },
});
