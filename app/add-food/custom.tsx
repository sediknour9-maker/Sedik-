import React, { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FOOD_CATEGORIES, FOOD_CATEGORY_META } from '../../src/components/foodMeta';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { TextField } from '../../src/components/ui/TextField';
import { Txt } from '../../src/components/ui/Txt';
import { parseDecimal } from '../../src/services/profileValidation';
import { useFoodDb } from '../../src/store/FoodDbContext';
import type { FoodCategory } from '../../src/models/food';

export default function CustomFoodScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mealSlot, date } = useLocalSearchParams<{ mealSlot?: string; date?: string }>();
  const { addCustomFood } = useFoodDb();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('other');
  const [portionGrams, setPortionGrams] = useState('100');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Macros are optional, so an empty field counts as 0; anything typed must be a number.
  const optional = (value: string) => (value.trim() === '' ? 0 : parseDecimal(value));
  const portion = parseDecimal(portionGrams);
  const energy = parseDecimal(kcal);
  const macros = [optional(protein), optional(carbs), optional(fat)];
  const canSave = name.trim() !== '' && portion > 0 && energy >= 0 && macros.every((value) => value >= 0);

  const save = async () => {
    const id = `custom_${Date.now()}`;
    await addCustomFood({
      id,
      nameKey: '',
      customName: name.trim(),
      category,
      portionUnits: [{ key: 'custom_portion', labelKey: 'portion.custom', gramsEquivalent: portion, isDefault: true }],
      perPortion: { kcal: Math.round(energy), proteinG: macros[0], carbsG: macros[1], fatG: macros[2] },
      isCustom: true,
    });
    router.replace({ pathname: '/add-food/[foodId]', params: { foodId: id, mealSlot, date } });
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Button
          label={t('custom.save')}
          icon="check"
          size="lg"
          disabled={!canSave}
          onPress={save}
          testID="custom-save"
        />
      }
    >
      <ScreenHeader title={t('custom.title')} subtitle={t('custom.subtitle')} onBack={() => router.back()} />

      <TextField label={t('custom.nameLabel')} value={name} onChangeText={setName} testID="custom-name" />

      <View style={{ gap: 10 }}>
        <Txt variant="label">{t('custom.category')}</Txt>
        <Row gap={8} wrap>
          {FOOD_CATEGORIES.map((value) => (
            <Chip
              key={value}
              icon={FOOD_CATEGORY_META[value].icon}
              label={t(FOOD_CATEGORY_META[value].labelKey)}
              selected={category === value}
              onPress={() => setCategory(value)}
            />
          ))}
        </Row>
      </View>

      <Row gap={10} align="flex-start">
        <TextField
          label={t('custom.portionGrams')}
          value={portionGrams}
          onChangeText={setPortionGrams}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          unit={t('units.g')}
          testID="custom-portion"
        />
        <TextField
          label={t('common.kcal')}
          value={kcal}
          onChangeText={setKcal}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          placeholder="0"
          testID="custom-kcal"
        />
      </Row>

      <Txt variant="label">{t('custom.macrosPerPortion')}</Txt>
      <Row gap={10} align="flex-start">
        <TextField
          label={t('common.protein')}
          value={protein}
          onChangeText={setProtein}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          unit={t('units.g')}
          placeholder="0"
        />
        <TextField
          label={t('common.carbs')}
          value={carbs}
          onChangeText={setCarbs}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          unit={t('units.g')}
          placeholder="0"
        />
        <TextField
          label={t('common.fat')}
          value={fat}
          onChangeText={setFat}
          keyboardType="decimal-pad"
          style={{ flex: 1 }}
          unit={t('units.g')}
          placeholder="0"
        />
      </Row>
    </Screen>
  );
}
