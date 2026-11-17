import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FOOD_CATEGORIES, FOOD_CATEGORY_META } from '../../src/components/foodMeta';
import { FoodRow } from '../../src/components/FoodRow';
import { MEAL_SLOT_META } from '../../src/components/mealSlotMeta';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { ChipScroller } from '../../src/components/ui/ChipScroller';
import type { IconName } from '../../src/components/ui/Icon';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SearchField } from '../../src/components/ui/SearchField';
import { Txt } from '../../src/components/ui/Txt';
import { formatDate } from '../../src/services/date';
import { searchFoods } from '../../src/services/foodRepository';
import { useFoodDb } from '../../src/store/FoodDbContext';
import { useLogs } from '../../src/store/LogContext';
import { colors, type Tone } from '../../src/theme/colors';
import { spacing } from '../../src/theme/tokens';
import type { FoodCategory } from '../../src/models/food';
import type { MealSlot } from '../../src/models/log';

const RECENT_SHOWN = 5;

interface ToolTileProps {
  icon: IconName;
  tone: Tone;
  label: string;
  onPress: () => void;
  testID: string;
}

function ToolTile({ icon, tone, label, onPress, testID }: ToolTileProps) {
  return (
    <Card onPress={onPress} style={styles.tool} testID={testID}>
      <Row gap={10}>
        <IconBadge icon={icon} tone={tone} size={36} />
        <Txt variant="label" numberOfLines={2} style={{ flex: 1 }}>
          {label}
        </Txt>
      </Row>
    </Card>
  );
}

export default function AddFoodScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { foods, recentFoods } = useFoodDb();
  const { today } = useLogs();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');

  const results = useMemo(
    () => searchFoods(foods, query, (key) => t(key), category === 'all' ? undefined : category),
    [foods, query, category, t]
  );
  const showRecent = !query.trim() && category === 'all' && recentFoods.length > 0;

  const slotMeta = mealSlot && mealSlot in MEAL_SLOT_META ? MEAL_SLOT_META[mealSlot as MealSlot] : undefined;
  const dayLabel = !date || date === today ? t('common.today') : formatDate(date, i18n.language, 'dayMonth');
  const subtitle = slotMeta ? `${t(slotMeta.labelKey)} · ${dayLabel}` : dayLabel;

  const openFood = (foodId: string) =>
    router.push({ pathname: '/add-food/[foodId]', params: { foodId, mealSlot, date } });

  const openCustom = () => router.push({ pathname: '/add-food/custom', params: { mealSlot, date } });

  return (
    <Screen edges={['top', 'bottom']} scroll={false} contentStyle={{ paddingBottom: 0 }}>
      <ScreenHeader title={t('addFood.title')} subtitle={subtitle} onBack={() => router.back()} />
      <SearchField
        value={query}
        onChangeText={setQuery}
        placeholder={t('browse.searchPlaceholder')}
        testID="food-search"
      />

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View style={{ gap: 14, paddingBottom: 4 }}>
            <Row gap={10} align="stretch">
              <ToolTile
                icon="barcode"
                tone="violet"
                label={t('addFood.scanBarcode')}
                onPress={() => router.push({ pathname: '/scan-barcode', params: { mealSlot, date } })}
                testID="tool-scan"
              />
              <ToolTile
                icon="plus"
                tone="secondary"
                label={t('addFood.createCustom')}
                onPress={openCustom}
                testID="tool-custom"
              />
            </Row>

            <ChipScroller>
              <Chip
                label={t('browse.categoryAll')}
                selected={category === 'all'}
                onPress={() => setCategory('all')}
                testID="category-all"
              />
              {FOOD_CATEGORIES.map((value) => (
                <Chip
                  key={value}
                  icon={FOOD_CATEGORY_META[value].icon}
                  label={t(FOOD_CATEGORY_META[value].labelKey)}
                  selected={category === value}
                  onPress={() => setCategory(value)}
                  testID={`category-${value}`}
                />
              ))}
            </ChipScroller>

            {showRecent ? (
              <View>
                <Txt variant="label" color={colors.textMuted}>
                  {t('addFood.recent')}
                </Txt>
                {recentFoods.slice(0, RECENT_SHOWN).map((food) => (
                  <FoodRow key={food.id} food={food} onPress={() => openFood(food.id)} testID={`recent-${food.id}`} />
                ))}
              </View>
            ) : null}

            <Txt variant="label" color={colors.textMuted}>
              {showRecent ? t('addFood.allFoods') : t('addFood.resultCount', { count: results.length })}
            </Txt>
          </View>
        }
        renderItem={({ item }) => <FoodRow food={item} onPress={() => openFood(item.id)} testID={`food-${item.id}`} />}
        ListEmptyComponent={
          <Card style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
            <IconBadge icon="search" tone="neutral" size={48} />
            <Txt variant="subheading" center>
              {t('addFood.noResults')}
            </Txt>
            <Button label={t('addFood.createCustom')} icon="plus" variant="soft" onPress={openCustom} />
          </Card>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tool: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.md, justifyContent: 'center' },
});
