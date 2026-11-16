import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Removes the default inner padding, for cards that manage their own layout. */
  flush?: boolean;
  testID?: string;
}

export function Card({ children, onPress, style, flush, testID }: CardProps) {
  const cardStyle = [styles.card, !flush && styles.padded, style];

  if (!onPress) {
    return (
      <View style={cardStyle} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  padded: { padding: spacing.lg },
  pressed: { opacity: 0.8 },
});
