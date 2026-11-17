import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/tokens';
import { textAlign, useRTL } from '../../theme/rtl';
import { hideWebFocusRing } from '../../theme/web';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Row } from './Row';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  testID?: string;
}

export function SearchField({ value, onChangeText, placeholder, autoFocus, testID }: SearchFieldProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Row gap={8} style={[styles.box, isFocused && styles.boxFocused]}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={placeholder}
        style={[styles.input, hideWebFocusRing, { textAlign: textAlign(isRTL) }]}
        testID={testID}
      />
      {value ? (
        <IconButton icon="close" label={t('common.clear')} size={28} filled={false} onPress={() => onChangeText('')} />
      ) : null}
    </Row>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  boxFocused: { borderColor: colors.primary },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, fontSize: 15, color: colors.text },
});
