import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../../src/store/SettingsContext';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { colors } from '../../src/theme/colors';
import { useRTL, textAlign } from '../../src/theme/rtl';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSettings();
  const router = useRouter();
  const isRTL = useRTL();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('onboarding.languageTitle')}</Text>
        <Text style={[styles.subtitle, { textAlign: textAlign(isRTL) }]}>{t('onboarding.languageSubtitle')}</Text>

        <View style={styles.switcher}>
          <LanguageSwitcher value={language} onChange={setLanguage} />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={() => router.push('/(onboarding)/setup')}>
          <Text style={styles.nextButtonText}>{t('common.next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
  switcher: { marginBottom: 40 },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
