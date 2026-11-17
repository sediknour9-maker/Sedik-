import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, type Tone } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';
import { rowDirection, useRTL } from '../../theme/rtl';
import { Icon, type IconName } from './Icon';
import { IconBadge } from './IconBadge';
import { Txt } from './Txt';

interface OptionCardProps {
  title: string;
  description?: string;
  icon?: IconName;
  tone?: Tone;
  /** Custom element in place of the icon badge. */
  leading?: ReactNode;
  selected: boolean;
  onPress: () => void;
  /** Stacks icon and text vertically, for options shown side by side. */
  vertical?: boolean;
  testID?: string;
}

/** A tappable choice in a single-select list; the selected one gets an accent border and a check. */
export function OptionCard({
  title,
  description,
  icon,
  tone = 'primary',
  leading,
  selected,
  onPress,
  vertical,
  testID,
}: OptionCardProps) {
  const isRTL = useRTL();

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        vertical ? styles.vertical : { flexDirection: rowDirection(isRTL) },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      {leading ?? (icon ? <IconBadge icon={icon} tone={selected ? 'primary' : tone} size={vertical ? 46 : 40} /> : null)}
      <View style={vertical ? styles.textVertical : styles.textHorizontal}>
        <Txt variant="subheading" center={vertical}>
          {title}
        </Txt>
        {description ? (
          <Txt variant="caption" color={colors.textMuted} center={vertical}>
            {description}
          </Txt>
        ) : null}
      </View>
      {!vertical ? (
        <Icon
          name={selected ? 'checkCircle' : 'circle'}
          size={22}
          color={selected ? colors.primary : colors.border}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  vertical: { flex: 1, paddingVertical: spacing.lg },
  selected: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.8 },
  textHorizontal: { flex: 1, gap: 2 },
  textVertical: { gap: 2, alignItems: 'center' },
});
