import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';
import { Button } from './Button';
import { registerConfirmHandler, type ConfirmOptions } from './confirm';
import { IconBadge } from './IconBadge';
import { Txt } from './Txt';

/** The web confirmation dialog behind confirmAction(); mount once above all screens. */
export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    registerConfirmHandler(setRequest);
    return () => registerConfirmHandler(null);
  }, []);

  useEffect(() => {
    if (!request || Platform.OS !== 'web') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setRequest(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request]);

  if (!request) return null;

  const cancel = () => setRequest(null);
  const confirm = () => {
    setRequest(null);
    request.onConfirm();
  };

  return (
    <View style={styles.backdrop} accessibilityViewIsModal testID="confirm-dialog">
      <Pressable style={StyleSheet.absoluteFill} onPress={cancel} accessibilityLabel={request.cancelLabel} />
      <View style={styles.dialog} accessibilityRole="alert">
        <IconBadge icon={request.destructive ? 'trash' : 'alert'} tone={request.destructive ? 'danger' : 'accent'} size={52} />
        <View style={{ gap: 6, alignSelf: 'stretch' }}>
          <Txt variant="heading" center>
            {request.title}
          </Txt>
          <Txt variant="body" center color={colors.textMuted}>
            {request.message}
          </Txt>
        </View>
        {/* Stacked full-width buttons, so long labels in any language never get cut off. */}
        <View style={{ gap: 10, alignSelf: 'stretch' }}>
          <Button label={request.confirmLabel} onPress={confirm} testID="confirm-ok" />
          <Button label={request.cancelLabel} variant="secondary" onPress={cancel} testID="confirm-cancel" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(5, 5, 6, 0.72)',
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
