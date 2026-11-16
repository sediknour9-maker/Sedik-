import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Set to false for screens that manage their own scrolling (e.g. long lists). */
  scroll?: boolean;
  /** Safe-area edges to pad. Tab screens only need the top; full-screen routes also the bottom. */
  edges?: Edge[];
  /** Stays pinned under the content, typically the screen's primary action. */
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Page scaffold: safe area, background, consistent padding and section spacing. */
export function Screen({ children, scroll = true, edges = ['top'], footer, contentStyle }: ScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  fill: { flex: 1 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
});
