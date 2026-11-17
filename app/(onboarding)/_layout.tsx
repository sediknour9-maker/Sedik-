import React from 'react';
import { Stack } from 'expo-router';

import { OnboardingDraftProvider } from '../../src/store/OnboardingDraftContext';
import { colors } from '../../src/theme/colors';

export default function OnboardingLayout() {
  return (
    <OnboardingDraftProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </OnboardingDraftProvider>
  );
}
