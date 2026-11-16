import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius } from '../../theme/tokens';
import { rowDirection, useRTL } from '../../theme/rtl';
import { Icon } from './Icon';

const VISIBLE_MS = 2200;
// The native animated module doesn't exist on web; animating in JS there avoids a warning.
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const ToastContext = createContext<(message: string) => void>(() => {});

/** Briefly confirms a completed action ("Saved", "Logged") without interrupting the user. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const isRTL = useRTL();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (text: string) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setMessage(text);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }).start();
      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }).start(() =>
          setMessage(null)
        );
      }, VISIBLE_MS);
    },
    [opacity]
  );

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {message ? (
        <View style={styles.anchor} pointerEvents="none">
          <Animated.View
            style={[styles.toast, { opacity, flexDirection: rowDirection(isRTL) }]}
            accessibilityLiveRegion="polite"
            testID="toast"
          >
            <Icon name="checkCircle" size={18} color={colors.secondaryLight} />
            <Text style={styles.text}>{message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', left: 0, right: 0, bottom: 96, alignItems: 'center' },
  toast: {
    alignItems: 'center',
    gap: 8,
    maxWidth: '88%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
});
