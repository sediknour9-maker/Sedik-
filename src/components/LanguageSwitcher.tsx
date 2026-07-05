import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../theme/colors';
import { useRTL, rowDirection } from '../theme/rtl';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
  de: 'Deutsch',
};

interface LanguageSwitcherProps {
  value: SupportedLanguage;
  onChange: (language: SupportedLanguage) => void;
}

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  const isRTL = useRTL();

  return (
    <View style={[styles.row, { flexDirection: rowDirection(isRTL) }]}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang}
          style={[styles.chip, lang === value && styles.chipActive]}
          onPress={() => onChange(lang)}
        >
          <Text style={[styles.chipText, lang === value && styles.chipTextActive]}>{LANGUAGE_LABELS[lang]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
