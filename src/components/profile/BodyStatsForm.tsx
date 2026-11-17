import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BODY_LIMITS, isValidBodyValue, type BodyField } from '../../services/profileValidation';
import { colors, type Tone } from '../../theme/colors';
import type { ActivityLevel, Sex } from '../../models/user';
import type { IconName } from '../ui/Icon';
import { NumberField } from '../ui/NumberField';
import { OptionCard } from '../ui/OptionCard';
import { Row } from '../ui/Row';
import { Txt } from '../ui/Txt';

export interface BodyStatsValues {
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel;
}

const SEX_OPTIONS: { value: Sex; icon: IconName; tone: Tone }[] = [
  { value: 'male', icon: 'mars', tone: 'info' },
  { value: 'female', icon: 'venus', tone: 'pink' },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; icon: IconName; tone: Tone }[] = [
  { value: 'sedentary', icon: 'armchair', tone: 'neutral' },
  { value: 'light', icon: 'footprints', tone: 'info' },
  { value: 'moderate', icon: 'bike', tone: 'secondary' },
  { value: 'active', icon: 'dumbbell', tone: 'accent' },
  { value: 'veryActive', icon: 'flame', tone: 'orange' },
];

const FIELDS: { field: BodyField; labelKey: string; unitKey: string; placeholder: string }[] = [
  { field: 'age', labelKey: 'onboarding.ageLabel', unitKey: 'units.years', placeholder: '28' },
  { field: 'heightCm', labelKey: 'onboarding.height', unitKey: 'units.cm', placeholder: '175' },
  { field: 'weightKg', labelKey: 'onboarding.weight', unitKey: 'units.kg', placeholder: '72' },
];

export function isBodyStatsComplete(values: BodyStatsValues): boolean {
  return FIELDS.every(({ field }) => isValidBodyValue(field, values[field]));
}

interface BodyStatsFormProps {
  values: BodyStatsValues;
  onChange: (patch: Partial<BodyStatsValues>) => void;
}

/** Sex, age, height, weight and activity level: everything the calorie target is computed from. */
export function BodyStatsForm({ values, onChange }: BodyStatsFormProps) {
  const { t } = useTranslation();

  // Only flag a field once something was typed into it.
  const invalidField = FIELDS.find(({ field }) => values[field] !== '' && !isValidBodyValue(field, values[field]));

  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('onboarding.sexLabel')}</Txt>
        <Row gap={12} align="stretch">
          {SEX_OPTIONS.map((option) => (
            <OptionCard
              key={option.value}
              vertical
              icon={option.icon}
              tone={option.tone}
              title={t(`onboarding.${option.value}`)}
              selected={values.sex === option.value}
              onPress={() => onChange({ sex: option.value })}
              testID={`sex-${option.value}`}
            />
          ))}
        </Row>
      </View>

      <View style={{ gap: 10 }}>
        <Row gap={10} align="flex-start">
          {FIELDS.map(({ field, labelKey, unitKey, placeholder }) => (
            <NumberField
              key={field}
              label={t(labelKey)}
              unit={t(unitKey)}
              placeholder={placeholder}
              value={values[field]}
              onChangeText={(text) => onChange({ [field]: text })}
              invalid={invalidField?.field === field}
              testID={`field-${field}`}
            />
          ))}
        </Row>
        {invalidField ? (
          <Txt variant="caption" color={colors.danger}>
            {t(invalidField.labelKey)}: {t('onboarding.rangeHint', BODY_LIMITS[invalidField.field])}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        <Txt variant="heading">{t('onboarding.activityLabel')}</Txt>
        {ACTIVITY_OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            icon={option.icon}
            tone={option.tone}
            title={t(`activityLevel.${option.value}`)}
            description={t(`activityLevel.${option.value}Desc`)}
            selected={values.activityLevel === option.value}
            onPress={() => onChange({ activityLevel: option.value })}
            testID={`activity-${option.value}`}
          />
        ))}
      </View>
    </View>
  );
}
