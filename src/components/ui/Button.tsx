import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { rowDirection, useRTL } from '../../theme/rtl';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'success' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary },
  secondary: { bg: colors.surfaceRaised, fg: colors.text, border: colors.border },
  soft: { bg: colors.primarySoft, fg: colors.primaryLight },
  ghost: { bg: 'transparent', fg: colors.primaryLight },
  success: { bg: colors.secondary, fg: colors.onPrimary },
  danger: { bg: 'transparent', fg: colors.danger, border: colors.danger },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; fontSize: number; iconSize: number; paddingHorizontal: number }> = {
  sm: { height: 36, fontSize: 13, iconSize: 16, paddingHorizontal: 12 },
  md: { height: 46, fontSize: 15, iconSize: 18, paddingHorizontal: 16 },
  lg: { height: 54, fontSize: 16, iconSize: 20, paddingHorizontal: 20 },
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled,
  loading,
  style,
  testID,
}: ButtonProps) {
  const isRTL = useRTL();
  const palette = VARIANT_STYLES[variant];
  const dimensions = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        {
          flexDirection: rowDirection(isRTL),
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
        },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={dimensions.iconSize} color={palette.fg} /> : null}
          <Text style={[styles.label, { color: palette.fg, fontSize: dimensions.fontSize }]} numberOfLines={1}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  label: { fontWeight: '700' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
});
