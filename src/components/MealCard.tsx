import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatNumber } from '../i18n/locale';
import { getFoodName } from '../services/foodRepository';
import { colors } from '../theme/colors';
import { spacing } from '../theme/tokens';
import type { FoodItem } from '../models/food';
import type { LogEntry, MealSlot } from '../models/log';
import { MEAL_SLOT_META } from './mealSlotMeta';
import { Card } from './ui/Card';
import { Chevron } from './ui/Chevron';
import { IconBadge } from './ui/IconBadge';
import { IconButton } from './ui/IconButton';
import { Row } from './ui/Row';
import { Txt } from './ui/Txt';

interface MealCardProps {
  slot: MealSlot;
  entries: LogEntry[];
  foods: FoodItem[];
  onAdd: () => void;
  onEditEntry: (entry: LogEntry) => void;
}

/** One meal of the day: its total, the logged foods (tap to edit) and an add button. */
export function MealCard({ slot, entries, foods, onAdd, onEditEntry }: MealCardProps) {
  const { t, i18n } = useTranslation();
  const meta = MEAL_SLOT_META[slot];
  const totalKcal = entries.reduce((sum, entry) => sum + entry.computed.kcal, 0);

  return (
    <Card flush testID={`meal-${slot}`}>
      <Row gap={12} style={styles.header}>
        <IconBadge icon={meta.icon} tone={meta.tone} size={40} />
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{t(meta.labelKey)}</Txt>
          <Txt variant="caption" color={colors.textMuted} tabular>
            {Math.round(totalKcal)} {t('common.kcal')}
          </Txt>
        </View>
        <IconButton
          icon="plus"
          label={`${t('dashboard.addFood')}: ${t(meta.labelKey)}`}
          color={colors.primaryLight}
          onPress={onAdd}
          testID={`meal-add-${slot}`}
        />
      </Row>

      {entries.map((entry) => {
        const food = foods.find((candidate) => candidate.id === entry.foodId);
        const portion = food?.portionUnits.find((unit) => unit.key === entry.portionUnitKey);
        return (
          <Pressable
            key={entry.id}
            onPress={() => onEditEntry(entry)}
            accessibilityRole="button"
            accessibilityHint={t('nutrition.tapToEdit')}
            testID={`entry-${entry.id}`}
            style={({ pressed }) => [styles.entry, pressed && { backgroundColor: colors.surfaceRaised }]}
          >
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Txt variant="body" numberOfLines={1}>
                  {food ? getFoodName(food, t) : entry.foodId}
                </Txt>
                <Txt variant="caption" color={colors.textMuted}>
                  {formatNumber(entry.multiplier, i18n.language)} × {portion ? t(portion.labelKey) : ''}
                </Txt>
              </View>
              <Txt variant="label" tabular>
                {entry.computed.kcal} {t('common.kcal')}
              </Txt>
              <Chevron size={16} />
            </Row>
          </Pressable>
        );
      })}

      {entries.length === 0 ? (
        <Txt variant="caption" color={colors.textDim} style={styles.empty}>
          {t('dashboard.noEntries')}
        </Txt>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.lg },
  entry: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  empty: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, marginTop: -spacing.xs },
});
