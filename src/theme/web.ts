import { Platform, type TextStyle } from 'react-native';

/**
 * Hides the browser's focus ring on text inputs that show focus with their own border.
 * React Native's types only allow solid/dotted/dashed here; react-native-web passes
 * 'none' through to CSS, which is the only value that also suppresses `outline: auto`.
 */
export const hideWebFocusRing: TextStyle | null =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;
