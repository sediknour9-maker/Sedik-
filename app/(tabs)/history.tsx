import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogs } from '../../src/store/LogContext';
import { getLogsForDate, aggregateMacros } from '../../src/services/logRepository';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';

interface DayTotal {
  date: string;
  kcal: number;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const { logDates } = useLogs();
  const [dayTotals, setDayTotals] = useState<DayTotal[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const totals = await Promise.all(
        logDates
          .slice()
          .reverse()
          .map(async (date) => {
            const entries = await getLogsForDate(date);
            return { date, kcal: aggregateMacros(entries).kcal };
          })
      );
      if (!cancelled) setDayTotals(totals);
    })();
    return () => {
      cancelled = true;
    };
  }, [logDates]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('history.title')}</Text>
      <FlatList
        data={dayTotals}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{t('history.noHistory')}</Text>}
        renderItem={({ item }) => (
          <View style={[styles.row, { flexDirection: rowDirection(isRTL) }]}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.kcal}>
              {Math.round(item.kcal)} {t('common.kcal')}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginHorizontal: 20, marginTop: 10, marginBottom: 12 },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 40 },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  date: { fontSize: 15, fontWeight: '600', color: colors.text },
  kcal: { fontSize: 14, color: colors.primaryDark, fontWeight: '600' },
});
