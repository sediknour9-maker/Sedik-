import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatDate, lastNDates, parseDate } from '../services/date';
import { colors } from '../theme/colors';
import { Icon } from './ui/Icon';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface WeekStripProps {
  today: string;
  /** Dates ('YYYY-MM-DD') on which the user logged food or an activity. */
  activeDates: string[];
}

/** The last seven days as dots; days with any logged food or activity are checked off. */
export function WeekStrip({ today, activeDates }: WeekStripProps) {
  const { i18n } = useTranslation();
  const active = new Set(activeDates);

  return (
    <Row justify="space-between">
      {lastNDates(today, 7).map((date) => {
        const isActive = active.has(date);
        const isToday = date === today;
        return (
          <View key={date} style={styles.day}>
            <Txt variant="micro" center color={isToday ? colors.text : colors.textMuted}>
              {formatDate(date, i18n.language, 'weekdayNarrow')}
            </Txt>
            <View style={[styles.dot, isToday && styles.dotToday, isActive && styles.dotActive]}>
              {isActive ? (
                <Icon name="check" size={15} color={colors.onPrimary} strokeWidth={3} />
              ) : (
                <Txt variant="micro" center tabular color={isToday ? colors.text : colors.textDim}>
                  {parseDate(date).getDate()}
                </Txt>
              )}
            </View>
          </View>
        );
      })}
    </Row>
  );
}

const styles = StyleSheet.create({
  day: { alignItems: 'center', gap: 6 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dotToday: { borderColor: colors.primary },
  dotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
});
