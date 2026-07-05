import { useTranslation } from 'react-i18next';

/**
 * Derives RTL directly from the active i18n language rather than
 * I18nManager, since I18nManager.forceRTL requires a native app reload and
 * does not reliably affect the Expo web preview used for testing here.
 */
export function useRTL(): boolean {
  const { i18n } = useTranslation();
  return i18n.language === 'ar';
}

/** Flips flexDirection/textAlign-sensitive style values for RTL layouts. */
export function rtlStyle<T extends Record<string, unknown>>(isRTL: boolean, ltr: T, rtl: Partial<T>): T {
  return isRTL ? { ...ltr, ...rtl } : ltr;
}

export function rowDirection(isRTL: boolean): 'row' | 'row-reverse' {
  return isRTL ? 'row-reverse' : 'row';
}

export function textAlign(isRTL: boolean): 'left' | 'right' {
  return isRTL ? 'right' : 'left';
}
