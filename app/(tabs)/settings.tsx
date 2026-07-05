import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../../src/store/SettingsContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useLogs } from '../../src/store/LogContext';
import { resetAllLogs } from '../../src/services/logRepository';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';
import type { RamadanOverride } from '../../src/models/user';

const RAMADAN_OPTIONS: { value: RamadanOverride; labelKey: string }[] = [
  { value: 'auto', labelKey: 'settings.ramadanAuto' },
  { value: 'on', labelKey: 'settings.ramadanOn' },
  { value: 'off', labelKey: 'settings.ramadanOff' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const router = useRouter();
  const { language, setLanguage, ramadanOverride, setRamadanOverride } = useSettings();
  const { resetProfile } = useProfile();
  const { refresh } = useLogs();

  const handleReset = () => {
    Alert.alert(t('settings.resetData'), t('settings.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        style: 'destructive',
        onPress: async () => {
          await resetAllLogs();
          await refresh();
          await resetProfile();
          router.replace('/(onboarding)/language');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('settings.title')}</Text>

        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <LanguageSwitcher value={language} onChange={setLanguage} />

        <Text style={styles.sectionLabel}>{t('settings.ramadanMode')}</Text>
        <View style={[styles.optionRow, { flexDirection: rowDirection(isRTL) }]}>
          {RAMADAN_OPTIONS.map(({ value, labelKey }) => (
            <TouchableOpacity
              key={value}
              style={[styles.option, ramadanOverride === value && styles.optionActive]}
              onPress={() => setRamadanOverride(value)}
            >
              <Text style={[styles.optionText, ramadanOverride === value && styles.optionTextActive]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>{t('settings.resetData')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 10, marginTop: 20 },
  optionRow: { gap: 8, flexWrap: 'wrap' },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 13 },
  optionTextActive: { color: '#fff', fontWeight: '600' },
  resetButton: {
    marginTop: 48,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  resetButtonText: { color: colors.danger, fontWeight: '700' },
});
