import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { useRTL, rowDirection } from '../theme/rtl';
import type { FoodItem } from '../models/food';

interface PortionPickerProps {
  food: FoodItem;
  portionUnitKey: string;
  multiplier: number;
  onChangePortionUnit: (key: string) => void;
  onChangeMultiplier: (multiplier: number) => void;
}

export function PortionPicker({
  food,
  portionUnitKey,
  multiplier,
  onChangePortionUnit,
  onChangeMultiplier,
}: PortionPickerProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('addFood.selectPortion')}</Text>
      <View style={[styles.segmentRow, { flexDirection: rowDirection(isRTL) }]}>
        {food.portionUnits.map((unit) => (
          <TouchableOpacity
            key={unit.key}
            style={[styles.segment, unit.key === portionUnitKey && styles.segmentActive]}
            onPress={() => onChangePortionUnit(unit.key)}
          >
            <Text style={[styles.segmentText, unit.key === portionUnitKey && styles.segmentTextActive]}>
              {t(unit.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>{t('addFood.quantity')}</Text>
      <View style={[styles.stepperRow, { flexDirection: rowDirection(isRTL) }]}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => onChangeMultiplier(Math.max(0.5, Math.round((multiplier - 0.5) * 10) / 10))}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.multiplierValue}>{multiplier}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => onChangeMultiplier(Math.round((multiplier + 0.5) * 10) / 10)}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 8, marginTop: 12 },
  segmentRow: { flexWrap: 'wrap', gap: 8 },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.text, fontSize: 13 },
  segmentTextActive: { color: '#fff', fontWeight: '600' },
  stepperRow: { alignItems: 'center', gap: 16 },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 20, color: colors.primary, fontWeight: '700' },
  multiplierValue: { fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 40, textAlign: 'center' },
});
