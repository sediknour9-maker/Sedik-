import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { useRTL, textAlign } from '../theme/rtl';

export function RamadanBanner() {
  const { t } = useTranslation();
  const isRTL = useRTL();

  return (
    <View style={styles.banner}>
      <Text style={styles.moon}>🌙</Text>
      <Text style={[styles.text, { textAlign: textAlign(isRTL) }]}>{t('ramadan.bannerActive')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  moon: { fontSize: 18 },
  text: { color: '#fff', fontWeight: '600', flex: 1 },
});
