import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Logo } from '../../src/components/brand/Logo';
import { ZelligePattern } from '../../src/components/brand/ZelligePattern';
import { Button } from '../../src/components/ui/Button';
import { OptionCard } from '../../src/components/ui/OptionCard';
import { Screen } from '../../src/components/ui/Screen';
import { StepIndicator } from '../../src/components/ui/StepIndicator';
import { Txt } from '../../src/components/ui/Txt';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { useSettings } from '../../src/store/SettingsContext';
import { colors } from '../../src/theme/colors';
import { MAX_CONTENT_WIDTH, radius, spacing } from '../../src/theme/tokens';

const HERO_HEIGHT = 250;

export default function LanguageScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { language, setLanguage } = useSettings();
  const heroWidth = Math.min(width, MAX_CONTENT_WIDTH);

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={{ paddingTop: 0 }}
      footer={
        <Button
          label={t('common.next')}
          size="lg"
          onPress={() => router.push('/(onboarding)/setup')}
          testID="onboarding-next"
        />
      }
    >
      <View style={[styles.hero, { width: heroWidth }]}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ZelligePattern width={heroWidth} height={HERO_HEIGHT} opacity={0.35} fadeTo={colors.background} />
        </View>
        <View style={styles.heroContent}>
          <Logo size={80} />
          <Txt variant="display" center>
            {t('common.appName')}
          </Txt>
          <Txt variant="body" center color={colors.textMuted}>
            {t('onboarding.tagline')}
          </Txt>
        </View>
      </View>

      <StepIndicator current={1} total={3} />

      <View style={{ gap: 4 }}>
        <Txt variant="title">{t('onboarding.languageTitle')}</Txt>
        <Txt variant="body" color={colors.textMuted}>
          {t('onboarding.languageSubtitle')}
        </Txt>
      </View>

      <View style={{ gap: 10 }}>
        {SUPPORTED_LANGUAGES.map((code) => (
          <OptionCard
            key={code}
            title={LANGUAGE_NAMES[code]}
            leading={
              <View style={styles.codeBadge}>
                <Txt variant="label" center color={colors.primaryLight}>
                  {code.toUpperCase()}
                </Txt>
              </View>
            }
            selected={language === code}
            onPress={() => setLanguage(code)}
            testID={`language-${code}`}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: HERO_HEIGHT,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -spacing.sm,
  },
  // Above the absolutely positioned pattern, so its fade doesn't tint the logo.
  heroContent: { alignItems: 'center', gap: spacing.sm, zIndex: 1 },
  codeBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
