// ar-MA keeps Western digits and Moroccan month names, matching local usage.
const INTL_LOCALES: Record<string, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  de: 'de-DE',
  ar: 'ar-MA',
};

export function intlLocale(language: string): string {
  return INTL_LOCALES[language] ?? 'en-GB';
}

/** Locale-aware number, e.g. 1.5 → "1,5" in German and French. */
export function formatNumber(value: number, language: string, maximumFractionDigits = 1): string {
  try {
    return new Intl.NumberFormat(intlLocale(language), { maximumFractionDigits }).format(value);
  } catch {
    return String(value);
  }
}
