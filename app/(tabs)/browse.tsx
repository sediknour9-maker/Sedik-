import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFoodDb } from '../../src/store/FoodDbContext';
import { searchFoods } from '../../src/services/foodRepository';
import { FoodListItem } from '../../src/components/FoodListItem';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';
import type { FoodCategory } from '../../src/models/food';

const CATEGORIES: { value: FoodCategory | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'browse.categoryAll' },
  { value: 'tagine', labelKey: 'browse.categoryTagine' },
  { value: 'soup', labelKey: 'browse.categorySoup' },
  { value: 'bread_pastry', labelKey: 'browse.categoryBreadPastry' },
  { value: 'couscous', labelKey: 'browse.categoryCouscous' },
  { value: 'drink', labelKey: 'browse.categoryDrink' },
  { value: 'sweet', labelKey: 'browse.categorySweet' },
  { value: 'grill', labelKey: 'browse.categoryGrill' },
  { value: 'other', labelKey: 'browse.categoryOther' },
];

export default function BrowseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { foods } = useFoodDb();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | 'all'>('all');

  const results = useMemo(
    () => searchFoods(foods, query, (key) => t(key), category === 'all' ? undefined : category),
    [foods, query, category, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('browse.title')}</Text>
        <TextInput
          style={[styles.search, { textAlign: textAlign(isRTL) }]}
          placeholder={t('browse.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          inverted={isRTL}
          contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, category === item.value && styles.chipActive]}
              onPress={() => setCategory(item.value)}
            >
              <Text style={[styles.chipText, category === item.value && styles.chipTextActive]}>
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FoodListItem
            title={t(item.nameKey)}
            kcal={item.perPortion.kcal}
            onPress={() => router.push(`/add-food/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
});
