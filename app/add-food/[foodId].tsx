import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { FOOD_CATEGORY_META } from '../../src/components/foodMeta';
import { MacroTiles } from '../../src/components/MacroTiles';
import { MEAL_SLOT_META } from '../../src/components/mealSlotMeta';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { confirmAction } from '../../src/components/ui/confirm';
import { IconBadge } from '../../src/components/ui/IconBadge';
import { Row } from '../../src/components/ui/Row';
import { Screen } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { Stepper } from '../../src/components/ui/Stepper';
import { useToast } from '../../src/components/ui/Toast';
import { Txt } from '../../src/components/ui/Txt';
import { formatNumber } from '../../src/i18n/locale';
import { computeMacrosForPortion, getDefaultPortion, getFoodName } from '../../src/services/foodRepository';
import { getMealSlotsFor } from '../../src/services/ramadanService';
import { useFoodDb } from '../../src/store/FoodDbContext';
import { useLogs } from '../../src/store/LogContext';
import { useSettings } from '../../src/store/SettingsContext';
import { colors } from '../../src/theme/colors';
import type { MealSlot } from '../../src/models/log';

const QUANTITY_STEP = 0.5;

function isMealSlot(value: string | undefined): value is MealSlot {
  return !!value && value in MEAL_SLOT_META;
}

export default function PortionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const showToast = useToast();
  const params = useLocalSearchParams<{ foodId: string; mealSlot?: string; date?: string; entryId?: string }>();
  const { foods, markFoodUsed } = useFoodDb();
  const { today, entries, addEntry, updateEntry, removeEntry } = useLogs();
  const { ramadanOverride } = useSettings();

  const editing = params.entryId ? entries.find((entry) => entry.id === params.entryId) : undefined;
  const food = foods.find((candidate) => candidate.id === params.foodId);
  const date = editing?.date ?? params.date ?? today;

  const slots = useMemo(() => {
    const active = getMealSlotsFor(date, ramadanOverride);
    return editing && !active.includes(editing.mealSlot) ? [...active, editing.mealSlot] : active;
  }, [date, ramadanOverride, editing]);

  const [mealSlot, setMealSlot] = useState<MealSlot>(
    () => editing?.mealSlot ?? (isMealSlot(params.mealSlot) ? params.mealSlot : slots[0])
  );
  const [portionUnitKey, setPortionUnitKey] = useState(
    () => editing?.portionUnitKey ?? (food ? getDefaultPortion(food).key : '')
  );
  const [multiplier, setMultiplier] = useState(() => editing?.multiplier ?? 1);
  const [isSaving, setIsSaving] = useState(false);

  if (!food) return <Redirect href="/(tabs)/nutrition" />;

  const meta = FOOD_CATEGORY_META[food.category];
  const defaultPortion = getDefaultPortion(food);
  const computed = computeMacrosForPortion(food, portionUnitKey, multiplier);

  // Back to wherever the flow started (Home or the diary), closing search and portion screens together.
  const close = () => (router.canDismiss() ? router.dismissAll() : router.replace('/(tabs)/nutrition'));

  const save = async () => {
    setIsSaving(true);
    if (editing) {
      await updateEntry({ ...editing, mealSlot, portionUnitKey, multiplier, computed });
      showToast(t('addFood.updated'));
    } else {
      await addEntry({
        id: `${Date.now()}`,
        date,
        mealSlot,
        foodId: food.id,
        portionUnitKey,
        multiplier,
        computed,
        loggedAt: new Date().toISOString(),
      });
      await markFoodUsed(food.id);
      showToast(t('addFood.added'));
    }
    close();
  };

  const remove = () => {
    if (!editing) return;
    confirmAction({
      title: t('addFood.deleteTitle'),
      message: getFoodName(food, t),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await removeEntry(editing);
        showToast(t('addFood.deleted'));
        close();
      },
    });
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <Row gap={10}>
          {editing ? (
            <Button
              label={t('common.delete')}
              icon="trash"
              variant="danger"
              size="lg"
              onPress={remove}
              testID="entry-delete"
            />
          ) : null}
          <Button
            label={editing ? t('common.save') : t('addFood.confirmAdd')}
            icon={editing ? 'check' : 'plus'}
            size="lg"
            loading={isSaving}
            onPress={save}
            style={{ flex: 1 }}
            testID="portion-save"
          />
        </Row>
      }
    >
      <ScreenHeader title={editing ? t('addFood.editTitle') : t('addFood.title')} onBack={() => router.back()} />

      <Row gap={14}>
        <IconBadge icon={meta.icon} tone={meta.tone} size={60} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title" style={{ fontSize: 22, lineHeight: 28 }}>
            {getFoodName(food, t)}
          </Txt>
          <Txt variant="caption" color={colors.textMuted}>
            {t(meta.labelKey)} · {food.perPortion.kcal} {t('common.kcal')} / {t(defaultPortion.labelKey)}
          </Txt>
        </View>
      </Row>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('addFood.selectMealSlot')}</Txt>
        <Row gap={8} wrap>
          {slots.map((slot) => (
            <Chip
              key={slot}
              icon={MEAL_SLOT_META[slot].icon}
              label={t(MEAL_SLOT_META[slot].labelKey)}
              selected={mealSlot === slot}
              tone="secondary"
              onPress={() => setMealSlot(slot)}
              testID={`slot-${slot}`}
            />
          ))}
        </Row>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('addFood.selectPortion')}</Txt>
        <Row gap={8} wrap>
          {food.portionUnits.map((unit) => (
            <Chip
              key={unit.key}
              label={`${t(unit.labelKey)} · ${unit.gramsEquivalent} ${t('units.g')}`}
              selected={portionUnitKey === unit.key}
              onPress={() => setPortionUnitKey(unit.key)}
              testID={`unit-${unit.key}`}
            />
          ))}
        </Row>
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('addFood.quantity')}</Txt>
        <Stepper
          value={`${formatNumber(multiplier, i18n.language)} ×`}
          canDecrement={multiplier > QUANTITY_STEP}
          onDecrement={() => setMultiplier(Math.max(QUANTITY_STEP, multiplier - QUANTITY_STEP))}
          onIncrement={() => setMultiplier(multiplier + QUANTITY_STEP)}
        />
      </View>

      <Card style={{ gap: 14 }}>
        <Row gap={6} align="flex-end">
          <Txt variant="display" tabular color={colors.primaryLight} testID="portion-kcal">
            {computed.kcal}
          </Txt>
          <Txt variant="subheading" color={colors.textMuted} style={{ marginBottom: 5 }}>
            {t('common.kcal')}
          </Txt>
        </Row>
        <MacroTiles proteinG={computed.proteinG} carbsG={computed.carbsG} fatG={computed.fatG} />
      </Card>
    </Screen>
  );
}
