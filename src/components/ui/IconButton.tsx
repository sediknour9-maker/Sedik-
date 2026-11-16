import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '../../theme/colors';
import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  /** Read by screen readers, since the button has no visible text. */
  label: string;
  size?: number;
  color?: string;
  /** Draws the round surface behind the icon. */
  filled?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  color = colors.text,
  filled = true,
  disabled,
  testID,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        filled && styles.filled,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  filled: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.35 },
});
