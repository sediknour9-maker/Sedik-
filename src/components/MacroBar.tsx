import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { useRTL, rowDirection, textAlign } from '../theme/rtl';

interface MacroRowProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
}

function MacroRow({ label, consumed, target, color }: MacroRowProps) {
  const isRTL = useRTL();
  const progress = target > 0 ? Math.min(consumed / target, 1) : 0;

  return (
    <View style={styles.row}>
      <View style={[styles.rowHeader, { flexDirection: rowDirection(isRTL) }]}>
        <Text style={[styles.label, { textAlign: textAlign(isRTL) }]}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(consumed)} / {Math.round(target)}g
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

interface MacroBarProps {
  consumed: { proteinG: number; carbsG: number; fatG: number };
  targets: { proteinG: number; carbsG: number; fatG: number };
}

export function MacroBar({ consumed, targets }: MacroBarProps) {
  const { t } = useTranslation();

  return (
    <View>
      <MacroRow label={t('common.protein')} consumed={consumed.proteinG} target={targets.proteinG} color={colors.secondary} />
      <MacroRow label={t('common.carbs')} consumed={consumed.carbsG} target={targets.carbsG} color={colors.accent} />
      <MacroRow label={t('common.fat')} consumed={consumed.fatG} target={targets.fatG} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: 10 },
  rowHeader: { justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 13, color: colors.text, fontWeight: '600' },
  value: { fontSize: 12, color: colors.textMuted },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
