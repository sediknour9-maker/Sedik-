import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFoodDb } from '../../src/store/FoodDbContext';
import { searchFoods, getFoodName } from '../../src/services/foodRepository';
import { FoodListItem } from '../../src/components/FoodListItem';
import { colors } from '../../src/theme/colors';
import { rowDirection, textAlign, useRTL } from '../../src/theme/rtl';

export default function AddFoodSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { foods } = useFoodDb();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchFoods(foods, query, (key) => t(key)), [foods, query, t]);

  const goToPortion = (foodId: string) => {
    router.push({ pathname: `/add-food/${foodId}`, params: { mealSlot, date } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('addFood.title')}</Text>
        <TextInput
          style={[styles.search, { textAlign: textAlign(isRTL) }]}
          placeholder={t('browse.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        <View style={[styles.toolRow, { flexDirection: rowDirection(isRTL) }]}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => router.push({ pathname: '/scan-barcode', params: { mealSlot, date } })}
          >
            <Text style={styles.toolButtonText}>📷 {t('addFood.scanBarcode')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => router.push({ pathname: '/add-food/custom', params: { mealSlot, date } })}
          >
            <Text style={styles.toolButtonText}>＋ {t('addFood.createCustom')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FoodListItem
            title={getFoodName(item, t)}
            kcal={item.perPortion.kcal}
            onPress={() => goToPortion(item.id)}
          />
        )}
      />

      <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
  toolRow: { gap: 8, marginBottom: 12 },
  toolButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  toolButtonText: { fontSize: 13, color: colors.primaryDark, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 12 },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { color: colors.textMuted, fontSize: 14 },
});
