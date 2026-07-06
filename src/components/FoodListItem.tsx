import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '../theme/colors';
import { useRTL, rowDirection, textAlign } from '../theme/rtl';

interface FoodListItemProps {
  title: string;
  subtitle?: string;
  kcal: number;
  onPress?: () => void;
  onRemove?: () => void;
}

export function FoodListItem({ title, subtitle, kcal, onPress, onRemove }: FoodListItemProps) {
  const isRTL = useRTL();

  return (
    <TouchableOpacity
      style={[styles.row, { flexDirection: rowDirection(isRTL) }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <View style={styles.textBlock}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { textAlign: textAlign(isRTL) }]}>{subtitle}</Text> : null}
      </View>
      <Text style={styles.kcal}>{Math.round(kcal)} kcal</Text>
      {onRemove ? (
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10,
  },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  kcal: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  removeButton: { paddingHorizontal: 6, paddingVertical: 2 },
  removeText: { fontSize: 18, color: colors.danger, fontWeight: '700' },
});
