import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ColumnChart } from '../../src/components/charts/ColumnChart';
import { TrendLineChart } from '../../src/components/charts/TrendLineChart';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Icon, type IconName } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TextField } from '../../src/components/ui/TextField';
import { useToast } from '../../src/components/ui/Toast';
import { Txt } from '../../src/components/ui/Txt';
import { formatNumber } from '../../src/i18n/locale';
import { formatDate, lastNDates } from '../../src/services/date';
import { getDailyTotals, type DayTotal } from '../../src/services/logRepository';
import { isValidBodyValue, parseDecimal } from '../../src/services/profileValidation';
import { computeLongestStreak, computeStreak } from '../../src/services/streakService';
import { useActivity } from '../../src/store/ActivityContext';
import { useLogs } from '../../src/store/LogContext';
import { useProfile } from '../../src/store/ProfileContext';
import { chartColors, colors, type Tone } from '../../src/theme/colors';
import type { Goal } from '../../src/models/user';

const HISTORY_SHOWN = 5;

interface StatTileProps {
  icon: IconName;
  tone: Tone;
  value: number;
  label: string;
  detail?: string;
  testID: string;
}

function StatTile({ icon, tone, value, label, detail, testID }: StatTileProps) {
  return (
    <Card style={styles.statTile} testID={testID}>
      <IconBadge icon={icon} tone={tone} size={36} />
      <View style={{ gap: 2 }}>
        <Txt variant="title" style={styles.statValue}>
          {value}
        </Txt>
        <Txt variant="caption" color={colors.textMuted} numberOfLines={2}>
          {label}
        </Txt>
        {detail ? (
          <Txt variant="micro" color={colors.textDim}>
            {detail}
          </Txt>
        ) : null}
      </View>
    </Card>
  );
}

/** Whether a weight change moves toward the user's goal; maintaining has no direction. */
function isTowardGoal(change: number, goal: Goal): boolean {
  if (goal === 'lose') return change < 0;
  if (goal === 'gain') return change > 0;
  return false;
}

export default function ProgressScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const showToast = useToast();
  const { profile, updateProfile } = useProfile();
  const { today, logDates, revision } = useLogs();
  const { weights, logWeight, activityDates, activityCounts } = useActivity();
  const [weightInput, setWeightInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [week, setWeek] = useState<DayTotal[]>([]);

  useEffect(() => {
    let cancelled = false;
    getDailyTotals(lastNDates(today, 7)).then((totals) => {
      if (!cancelled) setWeek(totals);
    });
    return () => {
      cancelled = true;
    };
  }, [today, revision]);

  const activeDates = useMemo(() => Array.from(new Set([...logDates, ...activityDates])), [logDates, activityDates]);
  const streak = computeStreak(activeDates, today);
  const bestStreak = Math.max(streak, computeLongestStreak(activeDates));

  const kg = t('units.kg');
  const kcal = t('common.kcal');
  const weightPoints = useMemo(() => weights.map((entry) => ({ date: entry.date, value: entry.weightKg })), [weights]);
  const weightChange = weights.length > 1 ? weights[weights.length - 1].weightKg - weights[0].weightKg : 0;
  const changeTone = profile && isTowardGoal(weightChange, profile.goal) ? colors.secondaryLight : colors.textMuted;
  const history = weights.slice().reverse().slice(0, HISTORY_SHOWN);

  const loggedDays = week.filter((day) => day.kcal > 0);
  const averageKcal = loggedDays.length
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.kcal, 0) / loggedDays.length)
    : 0;
  const goalKcal = profile?.targets.kcal ?? 0;

  const weightValid = isValidBodyValue('weightKg', weightInput);
  const weightInvalid = weightInput.trim() !== '' && !weightValid;

  const saveWeight = async () => {
    if (!weightValid) return;
    setIsSaving(true);
    const value = Math.round(parseDecimal(weightInput) * 10) / 10;
    await logWeight(value);
    // The latest weight drives the calorie targets, so keep the profile in step with the log.
    await updateProfile({ weightKg: value });
    setIsSaving(false);
    setWeightInput('');
    showToast(t('progress.weightSaved'));
  };

  // The sign and digits are isolated as left-to-right so Arabic text keeps the minus in front of the number.
  const formatSigned = (value: number) =>
    `⁦${value > 0 ? '+' : value < 0 ? '−' : '±'}${formatNumber(Math.abs(value), language, 1)}⁩ ${kg}`;

  return (
    <Screen>
      <ScreenHeader title={t('progress.title')} />

      <Row gap={12} wrap align="stretch">
        <StatTile
          icon="flame"
          tone="orange"
          value={streak}
          label={t('progress.streakDays', { count: streak })}
          detail={t('progress.bestStreak', { count: bestStreak })}
          testID="stat-streak"
        />
        <StatTile
          icon="dumbbell"
          tone="primary"
          value={activityCounts.strength}
          label={t('progress.totalWorkouts')}
          testID="stat-strength"
        />
        <StatTile
          icon="heartPulse"
          tone="info"
          value={activityCounts.cardio}
          label={t('progress.totalCardio')}
          testID="stat-cardio"
        />
        <StatTile
          icon="person"
          tone="violet"
          value={activityCounts.mobility}
          label={t('progress.totalMobility')}
          testID="stat-mobility"
        />
      </Row>

      <Card style={{ gap: 18 }} testID="weight-card">
        <Row gap={12}>
          <IconBadge icon="scale" tone="info" size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{t('progress.weightTitle')}</Txt>
            {profile ? (
              <Txt variant="caption" color={colors.textMuted}>
                {t(`onboarding.goal${profile.goal.charAt(0).toUpperCase()}${profile.goal.slice(1)}`)}
              </Txt>
            ) : null}
          </View>
          {weights.length > 1 ? (
            <Row gap={4} style={styles.changePill} testID="weight-change">
              <Icon
                name={weightChange < 0 ? 'trendingDown' : weightChange > 0 ? 'trendingUp' : 'target'}
                size={16}
                color={changeTone}
              />
              <Txt variant="label" tabular color={changeTone}>
                {formatSigned(weightChange)}
              </Txt>
            </Row>
          ) : null}
        </Row>

        {weightPoints.length ? (
          <TrendLineChart
            points={weightPoints}
            minSpan={2}
            formatTick={(value) => formatNumber(value, language, 1)}
            formatAxisDate={(date) => formatDate(date, language, 'dayMonth')}
            accessibilityLabel={`${t('progress.weightTitle')}: ${weightPoints
              .map((point) => `${formatDate(point.date, language, 'dayMonth')} ${formatNumber(point.value, language, 1)} ${kg}`)
              .join(', ')}`}
            testID="weight-chart"
            renderReadout={(point, index) => (
              <View>
                <Row gap={6} align="flex-end">
                  <Txt variant="display" testID="weight-readout">
                    {formatNumber(point.value, language, 1)}
                  </Txt>
                  <Txt variant="subheading" color={colors.textMuted} style={{ marginBottom: 5 }}>
                    {kg}
                  </Txt>
                </Row>
                <Txt variant="caption" color={colors.textMuted}>
                  {index === weightPoints.length - 1 && weights.length > 1
                    ? t('progress.sinceStart', {
                        change: formatSigned(weightChange),
                        date: formatDate(weightPoints[0].date, language, 'dayMonth'),
                      })
                    : formatDate(point.date, language, 'full')}
                </Txt>
              </View>
            )}
          />
        ) : (
          <View style={styles.empty}>
            <Txt variant="body" center color={colors.textMuted}>
              {t('progress.weightEmpty')}
            </Txt>
          </View>
        )}

        {weightPoints.length === 1 ? (
          <Txt variant="caption" color={colors.textMuted}>
            {t('progress.weightOnePoint')}
          </Txt>
        ) : null}

        <View style={{ gap: 8 }}>
          <Row gap={10} align="flex-end">
            <TextField
              label={t('progress.todayWeight')}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="decimal-pad"
              unit={kg}
              placeholder={profile ? formatNumber(profile.weightKg, language, 1) : '72'}
              invalid={weightInvalid}
              style={{ flex: 1 }}
              testID="weight-input"
            />
            <Button
              label={t('common.save')}
              icon="check"
              disabled={!weightValid}
              loading={isSaving}
              onPress={saveWeight}
              style={styles.saveButton}
              testID="weight-save"
            />
          </Row>
          {weightInvalid ? (
            <Txt variant="caption" color={colors.danger}>
              {t('onboarding.rangeHint', { min: 25, max: 300 })}
            </Txt>
          ) : null}
        </View>

        {history.length ? (
          <View>
            <Txt variant="label" color={colors.textMuted} style={{ marginBottom: 4 }}>
              {t('history.title')}
            </Txt>
            {history.map((entry, index) => {
              const previous = history[index + 1];
              const change = previous ? entry.weightKg - previous.weightKg : null;
              return (
                <Row key={entry.date} gap={10} style={styles.historyRow} testID={`weight-row-${entry.date}`}>
                  <Txt variant="body" style={{ flex: 1 }}>
                    {entry.date === today ? t('common.today') : formatDate(entry.date, language, 'full')}
                  </Txt>
                  {change !== null && change !== 0 ? (
                    <Txt variant="caption" tabular color={colors.textDim}>
                      {formatSigned(Math.round(change * 10) / 10)}
                    </Txt>
                  ) : null}
                  <Txt variant="subheading" tabular>
                    {formatNumber(entry.weightKg, language, 1)} {kg}
                  </Txt>
                </Row>
              );
            })}
          </View>
        ) : null}
      </Card>

      <Card style={{ gap: 18 }} testID="calories-card">
        <Row gap={12}>
          <IconBadge icon="flame" tone="primary" size={40} />
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{t('progress.caloriesTitle')}</Txt>
            <Txt variant="caption" color={colors.textMuted}>
              {loggedDays.length
                ? t('progress.caloriesSummary', {
                    average: formatNumber(averageKcal, language, 0),
                    count: loggedDays.length,
                  })
                : t('progress.noMealsWeek')}
            </Txt>
          </View>
        </Row>

        {week.length ? (
          <ColumnChart
            data={week.map((day) => ({
              key: day.date,
              label: formatDate(day.date, language, 'weekdayNarrow'),
              value: Math.round(day.kcal),
            }))}
            reference={goalKcal || undefined}
            defaultKey={today}
            formatTick={(value) => formatNumber(value, language, 0)}
            accessibilityLabel={`${t('progress.caloriesTitle')}: ${week
              .map((day) => `${formatDate(day.date, language, 'dayMonth')} ${Math.round(day.kcal)} ${kcal}`)
              .join(', ')}`}
            testID="calories-chart"
            renderReadout={(datum) => {
              const difference = datum.value - goalKcal;
              return (
                <Row gap={12} align="flex-end" justify="space-between">
                  <View style={{ flexShrink: 1 }}>
                    <Txt variant="caption" color={colors.textMuted}>
                      {datum.key === today ? t('common.today') : formatDate(datum.key, language, 'full')}
                    </Txt>
                    <Row gap={6} align="flex-end">
                      <Txt variant="title" testID="calories-readout">
                        {formatNumber(datum.value, language, 0)}
                      </Txt>
                      <Txt variant="subheading" color={colors.textMuted} style={{ marginBottom: 4 }}>
                        {kcal}
                      </Txt>
                    </Row>
                  </View>
                  <Txt variant="caption" color={colors.textMuted} style={{ marginBottom: 6, flexShrink: 1 }}>
                    {datum.value === 0
                      ? t('progress.nothingLogged')
                      : difference > 0
                        ? t('progress.overGoal', { value: formatNumber(difference, language, 0) })
                        : t('progress.underGoal', { value: formatNumber(-difference, language, 0) })}
                  </Txt>
                </Row>
              );
            }}
          />
        ) : null}

        {goalKcal ? (
          <Row gap={8}>
            <View style={styles.referenceKey} />
            <Txt variant="caption" color={colors.textMuted}>
              {t('progress.goalLine', { value: formatNumber(goalKcal, language, 0) })}
            </Txt>
          </Row>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statTile: { flexGrow: 1, flexBasis: '40%', gap: 12 },
  statValue: { fontSize: 26, lineHeight: 32 },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.surfaceRaised,
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  saveButton: { height: 51 },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  referenceKey: { width: 16, height: 2, borderRadius: 1, backgroundColor: chartColors.reference },
});
