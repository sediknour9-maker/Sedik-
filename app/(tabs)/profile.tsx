import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';

import { Logo } from '../../src/components/brand/Logo';
import { TargetsCard } from '../../src/components/profile/TargetsCard';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chevron } from '../../src/components/ui/Chevron';
import { Chip } from '../../src/components/ui/Chip';
import { confirmAction } from '../../src/components/ui/confirm';
import type { IconName } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { IconButton } from '../../src/components/ui/IconButton';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Segmented } from '../../src/components/ui/Segmented';
import { useToast } from '../../src/components/ui/Toast';
import { Txt } from '../../src/components/ui/Txt';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { formatNumber } from '../../src/i18n/locale';
import { useDataEpoch } from '../../src/store/DataEpochContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useSettings } from '../../src/store/SettingsContext';
import { colors, type Tone } from '../../src/theme/colors';
import type { Goal, RamadanOverride } from '../../src/models/user';

// Replace with the real invite link once the community server exists.
const COMMUNITY_DISCORD_URL = 'https://discord.com';

const GOAL_META: Record<Goal, { icon: IconName; tone: Tone; labelKey: string }> = {
  lose: { icon: 'trendingDown', tone: 'info', labelKey: 'onboarding.goalLose' },
  maintain: { icon: 'target', tone: 'secondary', labelKey: 'onboarding.goalMaintain' },
  gain: { icon: 'trendingUp', tone: 'orange', labelKey: 'onboarding.goalGain' },
};

interface SettingHeaderProps {
  icon: IconName;
  tone: Tone;
  title: string;
  hint?: string;
}

function SettingHeader({ icon, tone, title, hint }: SettingHeaderProps) {
  return (
    <Row gap={12}>
      <IconBadge icon={icon} tone={tone} size={36} />
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="subheading">{title}</Txt>
        {hint ? (
          <Txt variant="caption" color={colors.textMuted}>
            {hint}
          </Txt>
        ) : null}
      </View>
    </Row>
  );
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const showToast = useToast();
  const { language, setLanguage, ramadanOverride, setRamadanOverride } = useSettings();
  const { profile } = useProfile();
  const { resetAllData } = useDataEpoch();

  if (!profile) return null;

  const goal = GOAL_META[profile.goal];
  const bodySummary = [
    t(`onboarding.${profile.sex}`),
    `${profile.age} ${t('units.years')}`,
    `${profile.heightCm} ${t('units.cm')}`,
    `${formatNumber(profile.weightKg, i18n.language, 1)} ${t('units.kg')}`,
  ].join(' · ');

  const reset = () =>
    confirmAction({
      title: t('settings.resetData'),
      message: t('settings.resetConfirm'),
      confirmLabel: t('settings.resetAction'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await resetAllData();
        showToast(t('settings.resetDone'));
      },
    });

  const ramadanOptions: { value: RamadanOverride; label: string }[] = [
    { value: 'auto', label: t('settings.ramadanAuto') },
    { value: 'on', label: t('settings.ramadanOn') },
    { value: 'off', label: t('settings.ramadanOff') },
  ];

  return (
    <Screen>
      <ScreenHeader title={t('profile.title')} />

      <Card style={{ gap: 16 }} testID="profile-summary">
        <Row gap={14}>
          <IconBadge icon={profile.sex === 'female' ? 'venus' : 'mars'} tone={profile.sex === 'female' ? 'pink' : 'info'} size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="heading">{t('profile.yourProfile')}</Txt>
            <Txt variant="caption" color={colors.textMuted}>
              {bodySummary}
            </Txt>
          </View>
          <IconButton icon="pencil" label={t('profile.edit')} onPress={() => router.push('/profile-edit')} testID="profile-edit" />
        </Row>
        <Row gap={10} align="stretch">
          <Row gap={10} style={styles.fact}>
            <IconBadge icon={goal.icon} tone={goal.tone} size={32} />
            <View style={{ flex: 1 }}>
              <Txt variant="micro" color={colors.textDim}>
                {t('profile.goal')}
              </Txt>
              <Txt variant="label" numberOfLines={2}>
                {t(goal.labelKey)}
              </Txt>
            </View>
          </Row>
          <Row gap={10} style={styles.fact}>
            <IconBadge icon="activity" tone="secondary" size={32} />
            <View style={{ flex: 1 }}>
              <Txt variant="micro" color={colors.textDim}>
                {t('profile.activity')}
              </Txt>
              <Txt variant="label" numberOfLines={2}>
                {t(`activityLevel.${profile.activityLevel}`)}
              </Txt>
            </View>
          </Row>
        </Row>
      </Card>

      <TargetsCard targets={profile.targets} title={t('profile.yourTargets')} />

      <Txt variant="label" color={colors.textMuted} style={{ marginTop: 4 }}>
        {t('settings.title')}
      </Txt>

      <Card style={{ gap: 14 }}>
        <SettingHeader icon="languages" tone="info" title={t('settings.language')} />
        <Row gap={8} wrap>
          {SUPPORTED_LANGUAGES.map((code) => (
            <Chip
              key={code}
              label={LANGUAGE_NAMES[code]}
              selected={language === code}
              onPress={() => setLanguage(code)}
              testID={`settings-language-${code}`}
            />
          ))}
        </Row>
        <View style={styles.divider} />
        <SettingHeader icon="moonStar" tone="violet" title={t('settings.ramadanMode')} hint={t('settings.ramadanHint')} />
        <Segmented options={ramadanOptions} value={ramadanOverride} onChange={setRamadanOverride} />
      </Card>

      <Card onPress={() => Linking.openURL(COMMUNITY_DISCORD_URL)} testID="community-link">
        <Row gap={12}>
          <IconBadge icon="message" tone="violet" size={40} />
          <View style={{ flex: 1, gap: 1 }}>
            <Txt variant="subheading">{t('profile.joinDiscord')}</Txt>
            <Txt variant="caption" color={colors.textMuted}>
              {t('profile.communityHint')}
            </Txt>
          </View>
          <Chevron />
        </Row>
      </Card>

      <Card style={{ gap: 14 }}>
        <SettingHeader icon="info" tone="neutral" title={t('settings.dataTitle')} hint={t('settings.dataHint')} />
        <Button label={t('settings.resetData')} icon="trash" variant="danger" onPress={reset} testID="reset-data" />
      </Card>

      <View style={styles.footer}>
        <Logo size={28} />
        <Txt variant="caption" center color={colors.textDim}>
          {t('common.appName')} · {t('profile.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Txt>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fact: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  footer: { alignItems: 'center', gap: 6, paddingTop: 8 },
});
