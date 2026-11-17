import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getDefaultPortion, getFoodName } from '../services/foodRepository';
import { colors } from '../theme/colors';
import { useRTL } from '../theme/rtl';
import { spacing } from '../theme/tokens';
import type { FoodItem } from '../models/food';
import { FOOD_CATEGORY_META } from './foodMeta';
import { Chevron } from './ui/Chevron';
import { IconBadge } from './ui/IconBadge';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface FoodRowProps {
  food: FoodItem;
  onPress: () => void;
  testID?: string;
}

/** A food in search results: category icon, name, default portion and its calories. */
export function FoodRow({ food, onPress, testID }: FoodRowProps) {
  const { t } = useTranslation();
  const isRTL = useRTL();
  const meta = FOOD_CATEGORY_META[food.category];
  const portion = getDefaultPortion(food);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <Row gap={12}>
        <IconBadge icon={meta.icon} tone={meta.tone} size={42} />
        <View style={{ flex: 1 }}>
          <Txt variant="subheading" numberOfLines={1}>
            {getFoodName(food, t)}
          </Txt>
          <Txt variant="caption" color={colors.textMuted} numberOfLines={1}>
            1 {t(portion.labelKey)} · {portion.gramsEquivalent} {t('units.g')}
          </Txt>
        </View>
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
          <Txt variant="subheading" tabular>
            {food.perPortion.kcal}
          </Txt>
          <Txt variant="micro" color={colors.textMuted}>
            {t('common.kcal')}
          </Txt>
        </View>
        <Chevron />
      </Row>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
