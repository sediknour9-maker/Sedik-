import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/colors';
import { rowDirection, useRTL } from '../../theme/rtl';
import { IconButton } from './IconButton';

interface StepperProps {
  /** Already formatted for display, e.g. "30 min". */
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
}

export function Stepper({ value, onDecrement, onIncrement, canDecrement = true }: StepperProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();

  return (
    <View style={[styles.row, { flexDirection: rowDirection(isRTL) }]}>
      <IconButton
        icon="minus"
        label={t('common.decrease')}
        onPress={onDecrement}
        disabled={!canDecrement}
        color={colors.primaryLight}
      />
      <Text style={styles.value}>{value}</Text>
      <IconButton icon="plus" label={t('common.increase')} onPress={onIncrement} color={colors.primaryLight} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'center', gap: 18 },
  value: {
    minWidth: 84,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
});
