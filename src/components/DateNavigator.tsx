import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { addDays, formatDate } from '../services/date';
import { colors } from '../theme/colors';
import { useRTL } from '../theme/rtl';
import { Icon } from './ui/Icon';
import { IconButton } from './ui/IconButton';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface DateNavigatorProps {
  date: string;
  today: string;
  onChange: (date: string) => void;
}

/** Steps through days of the diary; tapping the label jumps back to today. Future days are blocked. */
export function DateNavigator({ date, today, onChange }: DateNavigatorProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useRTL();
  const isToday = date >= today;

  const label =
    date === today
      ? t('common.today')
      : date === addDays(today, -1)
        ? t('nutrition.yesterday')
        : formatDate(date, i18n.language, 'full');

  return (
    <Row gap={10}>
      <IconButton
        // "Earlier" points against the reading direction.
        icon={isRTL ? 'chevronRight' : 'chevronLeft'}
        label={t('nutrition.previousDay')}
        onPress={() => onChange(addDays(date, -1))}
        testID="date-prev"
      />
      <Pressable
        onPress={() => onChange(today)}
        disabled={isToday}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.center}
        testID="date-label"
      >
        <Row gap={8} justify="center">
          <Icon name="calendar" size={16} color={colors.textMuted} />
          <Txt variant="subheading" center numberOfLines={1}>
            {label}
          </Txt>
        </Row>
      </Pressable>
      <IconButton
        icon={isRTL ? 'chevronLeft' : 'chevronRight'}
        label={t('nutrition.nextDay')}
        onPress={() => onChange(addDays(date, 1))}
        disabled={isToday}
        testID="date-next"
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, paddingVertical: 8 },
});
