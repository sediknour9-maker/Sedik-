import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { Icon } from '../src/components/ui/Icon';
import { IconBadge } from '../src/components/ui/IconBadge';
import { IconButton } from '../src/components/ui/IconButton';
import { ProgressRing } from '../src/components/ui/ProgressRing';
import { Row } from '../src/components/ui/Row';
import { Screen } from '../src/components/ui/Screen';
import { useToast } from '../src/components/ui/Toast';
import { Txt } from '../src/components/ui/Txt';
import { MOBILITY_ROUTINE } from '../src/data/exercises';
import { formatClock } from '../src/services/workoutTiming';
import { useActivity } from '../src/store/ActivityContext';
import { useInterval } from '../src/store/useInterval';
import { useToday } from '../src/store/useToday';
import { colors } from '../src/theme/colors';
import { radius, spacing } from '../src/theme/tokens';

export default function MobilityPlayerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const today = useToday();
  const showToast = useToast();
  const { logActivity } = useActivity();

  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(MOBILITY_ROUTINE[0].durationSec);
  const [isPaused, setIsPaused] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [finishedMinutes, setFinishedMinutes] = useState<number | null>(null);

  const isFinished = finishedMinutes !== null;
  const exercise = MOBILITY_ROUTINE[index];
  const next = MOBILITY_ROUTINE[index + 1];

  useInterval(() => setRemaining((seconds) => seconds - 1), isPaused || isFinished ? null : 1000);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/training'));

  const finish = async () => {
    const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
    setFinishedMinutes(minutes);
    await logActivity({
      id: `${Date.now()}`,
      date: today,
      type: 'mobility',
      refId: 'routine',
      durationMin: minutes,
      loggedAt: new Date().toISOString(),
    });
    showToast(t('mobilityPlayer.saved'));
  };

  const advance = () => {
    if (next) {
      setIndex(index + 1);
      setRemaining(next.durationSec);
    } else {
      finish();
    }
  };

  // Move on automatically when an exercise's time is up.
  useEffect(() => {
    if (remaining <= 0 && !isFinished) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (isFinished) {
    return (
      <Screen
        edges={['top', 'bottom']}
        contentStyle={styles.centered}
        footer={<Button label={t('workout.done')} size="lg" onPress={leave} testID="mobility-done" />}
      >
        <IconBadge icon="trophy" tone="violet" size={96} />
        <View style={{ gap: 6 }}>
          <Txt variant="title" center>
            {t('mobilityPlayer.completeTitle')}
          </Txt>
          <Txt variant="body" center color={colors.textMuted}>
            {t('home.durationApprox', { minutes: finishedMinutes })} · {MOBILITY_ROUTINE.length}{' '}
            {t('mobilityPlayer.exercisesDone')}
          </Txt>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Row gap={12}>
        <IconButton icon="close" label={t('common.cancel')} onPress={leave} testID="mobility-close" />
        <View style={{ flex: 1 }}>
          <Txt variant="caption" color={colors.textMuted}>
            {t('training.mobilityTitle')}
          </Txt>
          <Txt variant="heading">{t('mobilityPlayer.step', { current: index + 1, total: MOBILITY_ROUTINE.length })}</Txt>
        </View>
      </Row>

      <Row gap={4}>
        {MOBILITY_ROUTINE.map((item, itemIndex) => (
          <View
            key={item.id}
            style={[
              styles.segment,
              { backgroundColor: itemIndex < index ? colors.violet : itemIndex === index ? colors.primary : colors.border },
            ]}
          />
        ))}
      </Row>

      <View style={styles.centered}>
        <ProgressRing
          size={240}
          strokeWidth={14}
          progress={remaining / exercise.durationSec}
          color={colors.violet}
          gradientTo={colors.info}
        >
          <Txt variant="display" center tabular style={{ fontSize: 48, lineHeight: 54 }}>
            {formatClock(remaining)}
          </Txt>
          <Txt variant="label" center color={colors.textMuted}>
            {isPaused ? t('mobilityPlayer.paused') : t(exercise.targetKey)}
          </Txt>
        </ProgressRing>

        <View style={{ gap: 4 }}>
          <Txt variant="title" center testID="mobility-current">
            {t(exercise.nameKey)}
          </Txt>
          {next ? (
            <Txt variant="body" center color={colors.textMuted}>
              {t('mobilityPlayer.nextUp', { name: t(next.nameKey) })}
            </Txt>
          ) : null}
        </View>

        <Row gap={24} justify="center">
          <IconButton
            icon="skip"
            label={t('mobilityPlayer.skip')}
            size={56}
            color={colors.textMuted}
            onPress={advance}
            testID="mobility-skip"
          />
          <Pressable
            onPress={() => setIsPaused((paused) => !paused)}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? t('mobilityPlayer.resume') : t('mobilityPlayer.pause')}
            style={({ pressed }) => [styles.playButton, pressed && { opacity: 0.8 }]}
            testID="mobility-toggle"
          >
            <Icon name={isPaused ? 'play' : 'pause'} size={34} color={colors.onPrimary} fill={colors.onPrimary} />
          </Pressable>
          <View style={{ width: 56 }} />
        </Row>
      </View>

      <Card style={{ gap: 2 }}>
        {MOBILITY_ROUTINE.map((item, itemIndex) => (
          <Row key={item.id} gap={12} style={styles.listRow}>
            <Icon
              name={itemIndex < index ? 'checkCircle' : itemIndex === index ? 'play' : 'circle'}
              size={18}
              color={itemIndex < index ? colors.secondaryLight : itemIndex === index ? colors.primary : colors.border}
            />
            <Txt
              variant="body"
              style={{ flex: 1 }}
              color={itemIndex === index ? colors.text : colors.textMuted}
              numberOfLines={1}
            >
              {t(item.nameKey)}
            </Txt>
            <Txt variant="caption" tabular color={colors.textDim}>
              {formatClock(item.durationSec)}
            </Txt>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRow: { paddingVertical: 6, borderRadius: radius.sm },
});
