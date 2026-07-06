import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFoodDb } from '../../src/store/FoodDbContext';
import { colors } from '../../src/theme/colors';
import { textAlign, useRTL } from '../../src/theme/rtl';

export default function CustomFoodScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = useRTL();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { addCustomFood } = useFoodDb();

  const [name, setName] = useState('');
  const [portionGrams, setPortionGrams] = useState('100');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const parse = (value: string) => Number(value.replace(',', '.')) || 0;
  const canSave = name.trim() !== '' && parse(kcal) > 0 && parse(portionGrams) > 0;

  const handleSave = async () => {
    const id = `custom_${Date.now()}`;
    await addCustomFood({
      id,
      nameKey: '',
      customName: name.trim(),
      category: 'other',
      portionUnits: [
        { key: 'custom_portion', labelKey: 'portion.custom', gramsEquivalent: parse(portionGrams), isDefault: true },
      ],
      perPortion: {
        kcal: Math.round(parse(kcal)),
        proteinG: parse(protein),
        carbsG: parse(carbs),
        fatG: parse(fat),
      },
      isCustom: true,
    });
    router.replace({ pathname: `/add-food/${id}`, params: { mealSlot, date } });
  };

  const field = (label: string, value: string, setter: (v: string) => void, numeric = true) => (
    <>
      <Text style={[styles.label, { textAlign: textAlign(isRTL) }]}>{label}</Text>
      <TextInput
        style={[styles.input, { textAlign: textAlign(isRTL) }]}
        keyboardType={numeric ? 'numeric' : 'default'}
        value={value}
        onChangeText={setter}
      />
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { textAlign: textAlign(isRTL) }]}>{t('custom.title')}</Text>

        {field(t('custom.nameLabel'), name, setName, false)}
        {field(t('custom.portionGrams'), portionGrams, setPortionGrams)}
        {field(`${t('common.kcal')}`, kcal, setKcal)}
        {field(`${t('common.protein')} (g)`, protein, setProtein)}
        {field(`${t('common.carbs')} (g)`, carbs, setCarbs)}
        {field(`${t('common.fat')} (g)`, fat, setFat)}

        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 48 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: 14 },
  cancelButtonText: { color: colors.textMuted, fontSize: 14 },
});
