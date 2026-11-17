import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';
import { rowDirection, textAlign, useRTL } from '../../theme/rtl';
import { Txt } from './Txt';

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Unit shown inside the field after the number, e.g. "kg". */
  unit?: string;
  placeholder?: string;
  /** Marks the field with a red border. */
  invalid?: boolean;
  /** Message under the field, e.g. what range is allowed. */
  hint?: string;
  testID?: string;
}

export function NumberField({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
  invalid,
  hint,
  testID,
}: NumberFieldProps) {
  const isRTL = useRTL();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Txt variant="label" color={colors.textMuted} numberOfLines={1}>
        {label}
      </Txt>
      <View
        style={[
          styles.box,
          { flexDirection: rowDirection(isRTL) },
          isFocused && styles.boxFocused,
          invalid && styles.boxInvalid,
        ]}
      >
        <TextInput
          style={[styles.input, { textAlign: textAlign(isRTL) }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          accessibilityLabel={label}
          testID={testID}
        />
        {unit ? (
          <Txt variant="label" color={colors.textMuted}>
            {unit}
          </Txt>
        ) : null}
      </View>
      {hint ? (
        <Txt variant="caption" color={invalid ? colors.danger : colors.textMuted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: spacing.xs + 2 },
  box: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.primary },
  boxInvalid: { borderColor: colors.danger },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    // The box border shows focus; the browser's own focus ring would draw a second frame.
    outlineWidth: 0,
  },
});
